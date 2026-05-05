using System.IO;
using System.Text.Json;
using Microsoft.Maui.Storage;
using SQLite;

namespace HTQSFR.Services;

public sealed class PoiDetailCacheService
{
    private const string DatabaseName = "htqsfr_cache.db3";

    private static readonly SemaphoreSlim InitLock = new(1, 1);

    private SQLiteAsyncConnection? _database;

    public async Task<PoiDto?> GetPoiAsync(string language, string poiId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return null;

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            var row = await db.Table<PoiDetailCacheRow>()
                .Where(x => x.Language == normalizedLanguage && x.PoiId == poiId)
                .FirstOrDefaultAsync();

            return row is null ? null : ToPoiDto(row);
        }
        catch
        {
            return null;
        }
    }

    public async Task SavePoiAsync(string language, PoiDto poi)
    {
        try
        {
            if (poi is null || string.IsNullOrWhiteSpace(poi.Id))
                return;

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            var existing = await db.Table<PoiDetailCacheRow>()
                .Where(x => x.Language == normalizedLanguage && x.PoiId == poi.Id)
                .FirstOrDefaultAsync();

            var row = ToPoiRow(normalizedLanguage, poi);

            if (existing is null)
            {
                await db.InsertAsync(row);
            }
            else
            {
                row.Id = existing.Id;
                await db.UpdateAsync(row);
            }
        }
        catch
        {
            // ignore cache errors
        }
    }

    public async Task UpdateFavoriteStateAsync(string poiId, bool isFavorite)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return;

            var db = await GetDatabaseAsync();

            var rows = await db.Table<PoiDetailCacheRow>()
                .Where(x => x.PoiId == poiId)
                .ToListAsync();

            if (rows.Count == 0)
                return;

            foreach (var row in rows)
                row.IsFavorite = isFavorite;

            await db.UpdateAllAsync(rows);
        }
        catch
        {
            // ignore cache errors
        }
    }

    public async Task<List<PoiMenuItemDto>> GetMenuAsync(string language, string poiId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return new List<PoiMenuItemDto>();

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            var rows = await db.Table<PoiMenuCacheRow>()
                .Where(x => x.Language == normalizedLanguage && x.PoiId == poiId)
                .OrderBy(x => x.SortOrder)
                .ToListAsync();

            if (rows.Count == 0)
                return new List<PoiMenuItemDto>();

            return rows.Select(ToMenuDto).ToList();
        }
        catch
        {
            return new List<PoiMenuItemDto>();
        }
    }

    public async Task SaveMenuAsync(string language, string poiId, List<PoiMenuItemDto> items)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return;

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            await db.ExecuteAsync(
                "DELETE FROM PoiMenuCacheRows WHERE Language = ? AND PoiId = ?",
                normalizedLanguage,
                poiId);

            if (items is null || items.Count == 0)
                return;

            var rows = items
                .Select((item, index) => ToMenuRow(normalizedLanguage, poiId, item, index))
                .ToList();

            await db.InsertAllAsync(rows);
        }
        catch
        {
            // ignore cache errors
        }
    }

    public async Task<PoiAudioDto?> GetAudioAsync(string language, string poiId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return null;

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            var row = await db.Table<PoiAudioCacheRow>()
                .Where(x => x.Language == normalizedLanguage && x.PoiId == poiId)
                .FirstOrDefaultAsync();

            return row is null ? null : ToAudioDto(row);
        }
        catch
        {
            return null;
        }
    }

    public async Task SaveAudioAsync(string language, string poiId, PoiAudioDto? audio)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(poiId))
                return;

            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            await db.ExecuteAsync(
                "DELETE FROM PoiAudioCacheRows WHERE Language = ? AND PoiId = ?",
                normalizedLanguage,
                poiId);

            if (audio is null)
                return;

            await db.InsertAsync(ToAudioRow(normalizedLanguage, poiId, audio));
        }
        catch
        {
            // ignore cache errors
        }
    }

    private async Task<SQLiteAsyncConnection> GetDatabaseAsync()
    {
        if (_database is not null)
            return _database;

        await InitLock.WaitAsync();

        try
        {
            if (_database is null)
            {
                string dbPath = Path.Combine(FileSystem.AppDataDirectory, DatabaseName);

                _database = new SQLiteAsyncConnection(
                    dbPath,
                    SQLiteOpenFlags.ReadWrite |
                    SQLiteOpenFlags.Create |
                    SQLiteOpenFlags.SharedCache);

                await _database.CreateTableAsync<PoiDetailCacheRow>();
                await _database.CreateTableAsync<PoiMenuCacheRow>();
                await _database.CreateTableAsync<PoiAudioCacheRow>();
            }
        }
        finally
        {
            InitLock.Release();
        }

        return _database!;
    }

    private static string NormalizeLanguage(string language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return "vi";

        return language.Trim();
    }

    private static PoiDetailCacheRow ToPoiRow(string language, PoiDto poi)
    {
        return new PoiDetailCacheRow
        {
            PoiId = poi.Id,
            Language = language,

            MongoId = poi.MongoId,
            Name = poi.Name,
            ShortDescription = poi.ShortDescription,
            FullDescription = poi.FullDescription,

            Latitude = poi.Latitude,
            Longitude = poi.Longitude,

            ImageUrl = poi.ImageUrl,
            ImagesJson = SerializeList(poi.Images),

            BadgeText = poi.BadgeText,
            TimeText = poi.TimeText,
            InfoTagsJson = SerializeList(poi.InfoTags),

            IsFavorite = poi.IsFavorite,
            AverageRating = poi.AverageRating,
            TotalReviews = poi.TotalReviews,
            Status = poi.Status,

            CategoryId = poi.Category?.Id ?? string.Empty,
            CategoryMongoId = poi.Category?.MongoId ?? string.Empty,
            CategoryName = poi.Category?.Name ?? string.Empty,
            CategorySlug = poi.Category?.Slug ?? string.Empty,

            Address = poi.Address,
            GeofenceRadius = poi.GeofenceRadius,
            AudioPriority = poi.AudioPriority,
            AudioUrl = poi.AudioUrl,
            AudioUrlSnake = poi.AudioUrlSnake,

            CachedAtUtc = DateTime.UtcNow
        };
    }

    private static PoiDto ToPoiDto(PoiDetailCacheRow row)
    {
        return new PoiDto
        {
            Id = row.PoiId,
            MongoId = row.MongoId,
            Name = row.Name,
            ShortDescription = row.ShortDescription,
            FullDescription = row.FullDescription,

            Latitude = row.Latitude,
            Longitude = row.Longitude,

            ImageUrl = row.ImageUrl,
            Images = DeserializeList(row.ImagesJson),

            BadgeText = row.BadgeText,
            TimeText = row.TimeText,
            InfoTags = DeserializeList(row.InfoTagsJson),

            IsFavorite = row.IsFavorite,
            AverageRating = row.AverageRating,
            TotalReviews = row.TotalReviews,
            Status = row.Status,

            Category = new PoiCategoryDto
            {
                Id = row.CategoryId,
                MongoId = row.CategoryMongoId,
                Name = row.CategoryName,
                Slug = row.CategorySlug
            },

            Address = row.Address,
            GeofenceRadius = row.GeofenceRadius,
            AudioPriority = row.AudioPriority,
            AudioUrl = row.AudioUrl,
            AudioUrlSnake = row.AudioUrlSnake
        };
    }

    private static PoiMenuCacheRow ToMenuRow(
        string language,
        string poiId,
        PoiMenuItemDto item,
        int sortOrder)
    {
        return new PoiMenuCacheRow
        {
            PoiId = poiId,
            Language = language,
            SortOrder = sortOrder,

            ItemId = item.Id,
            MongoId = item.MongoId,
            ItemCode = item.ItemCode,
            Name = item.Name,
            Description = item.Description,
            Price = item.Price,
            PriceText = item.PriceText,
            ImageUrl = item.ImageUrl,
            ImagesJson = SerializeList(item.Images),
            Category = item.Category
        };
    }

    private static PoiMenuItemDto ToMenuDto(PoiMenuCacheRow row)
    {
        return new PoiMenuItemDto
        {
            Id = row.ItemId,
            MongoId = row.MongoId,
            PoiId = row.PoiId,
            ItemCode = row.ItemCode,
            Name = row.Name,
            Description = row.Description,
            Price = row.Price,
            PriceText = row.PriceText,
            ImageUrl = row.ImageUrl,
            Images = DeserializeList(row.ImagesJson),
            Category = row.Category
        };
    }

    private static PoiAudioCacheRow ToAudioRow(
        string language,
        string poiId,
        PoiAudioDto audio)
    {
        return new PoiAudioCacheRow
        {
            PoiId = poiId,
            Language = language,
            AudioUrl = audio.AudioUrl,
            AudioSourceType = audio.AudioSourceType,
            Duration = audio.Duration,
            FileName = audio.FileName,
            NarrationId = audio.NarrationId,
            NarrationTitle = audio.NarrationTitle,
            SpeechText = audio.SpeechText,
            HasAudioAsset = audio.HasAudioAsset,
            IsFallbackText = audio.IsFallbackText
        };
    }

    private static PoiAudioDto ToAudioDto(PoiAudioCacheRow row)
    {
        return new PoiAudioDto
        {
            PoiId = row.PoiId,
            Language = row.Language,
            AudioUrl = row.AudioUrl,
            AudioSourceType = row.AudioSourceType,
            Duration = row.Duration,
            FileName = row.FileName,
            NarrationId = row.NarrationId,
            NarrationTitle = row.NarrationTitle,
            SpeechText = row.SpeechText,
            HasAudioAsset = row.HasAudioAsset,
            IsFallbackText = row.IsFallbackText
        };
    }

    private static string SerializeList(List<string>? values)
    {
        if (values is null || values.Count == 0)
            return "[]";

        try
        {
            return JsonSerializer.Serialize(values);
        }
        catch
        {
            return "[]";
        }
    }

    private static List<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    [Table("PoiDetailCacheRows")]
    private sealed class PoiDetailCacheRow
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        [Indexed]
        public string PoiId { get; set; } = string.Empty;

        [Indexed]
        public string Language { get; set; } = "vi";

        public string MongoId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public string ImageUrl { get; set; } = string.Empty;
        public string ImagesJson { get; set; } = "[]";

        public string BadgeText { get; set; } = string.Empty;
        public string TimeText { get; set; } = string.Empty;
        public string InfoTagsJson { get; set; } = "[]";

        public bool IsFavorite { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public string Status { get; set; } = string.Empty;

        public string CategoryId { get; set; } = string.Empty;
        public string CategoryMongoId { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string CategorySlug { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
        public double GeofenceRadius { get; set; }
        public int AudioPriority { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public string AudioUrlSnake { get; set; } = string.Empty;

        public DateTime CachedAtUtc { get; set; }
    }

    [Table("PoiMenuCacheRows")]
    private sealed class PoiMenuCacheRow
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        [Indexed]
        public string PoiId { get; set; } = string.Empty;

        [Indexed]
        public string Language { get; set; } = "vi";

        public int SortOrder { get; set; }

        public string ItemId { get; set; } = string.Empty;
        public string MongoId { get; set; } = string.Empty;
        public string ItemCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string PriceText { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string ImagesJson { get; set; } = "[]";
        public string Category { get; set; } = string.Empty;
    }

    [Table("PoiAudioCacheRows")]
    private sealed class PoiAudioCacheRow
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        [Indexed]
        public string PoiId { get; set; } = string.Empty;

        [Indexed]
        public string Language { get; set; } = "vi";

        public bool HasAudioAsset { get; set; }
        public string AudioUrl { get; set; } = string.Empty;
        public string AudioSourceType { get; set; } = string.Empty;
        public double Duration { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string NarrationId { get; set; } = string.Empty;
        public string NarrationTitle { get; set; } = string.Empty;
        public string SpeechText { get; set; } = string.Empty;
        public bool IsFallbackText { get; set; }
    }
}