using System.Text.Json;
using Microsoft.Maui.Storage;
using SQLite;

namespace HTQSFR.Services;

public sealed class PoiCacheService
{
    private const string DatabaseName = "htqsfr_cache.db3";

    private static readonly SemaphoreSlim InitLock = new(1, 1);

    private SQLiteAsyncConnection? _database;

    public async Task<List<PoiDto>> GetPoisAsync(string language)
    {
        try
        {
            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            var rows = await db.Table<PoiCacheRow>()
                .Where(x => x.Language == normalizedLanguage)
                .OrderBy(x => x.SortOrder)
                .ToListAsync();

            if (rows.Count == 0)
                return new List<PoiDto>();

            return rows.Select(ToPoiDto).ToList();
        }
        catch
        {
            return new List<PoiDto>();
        }
    }

    public async Task SavePoisAsync(string language, List<PoiDto> pois)
    {
        if (pois is null || pois.Count == 0)
            return;

        try
        {
            var db = await GetDatabaseAsync();
            string normalizedLanguage = NormalizeLanguage(language);

            await db.ExecuteAsync(
                "DELETE FROM PoiCacheRows WHERE Language = ?",
                normalizedLanguage);

            var rows = pois
                .Select((poi, index) => ToRow(poi, normalizedLanguage, index))
                .ToList();

            await db.InsertAllAsync(rows);
        }
        catch
        {
            // Không để cache làm hỏng flow chính.
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

                await _database.CreateTableAsync<PoiCacheRow>();
            }
        }
        finally
        {
            InitLock.Release();
        }

        return _database!;
    }

    private static PoiCacheRow ToRow(PoiDto poi, string language, int sortOrder)
    {
        return new PoiCacheRow
        {
            PoiId = poi.Id,
            Language = language,
            SortOrder = sortOrder,

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

    private static PoiDto ToPoiDto(PoiCacheRow row)
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

    private static string NormalizeLanguage(string language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return "vi";

        return language.Trim();
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

    [Table("PoiCacheRows")]
    private sealed class PoiCacheRow
    {
        [PrimaryKey, AutoIncrement]
        public int Id { get; set; }

        [Indexed]
        public string PoiId { get; set; } = string.Empty;

        [Indexed]
        public string Language { get; set; } = "vi";

        public int SortOrder { get; set; }

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
}