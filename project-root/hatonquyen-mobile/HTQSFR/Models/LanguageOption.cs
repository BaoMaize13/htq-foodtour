namespace HTQSFR.Models
{
    public class LanguageOption
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public string ChooseLanguageText { get; set; }
        public string GetStartedText { get; set; }

        public LanguageOption(
            string code,
            string name,
            string chooseLanguageText,
            string getStartedText)
        {
            Code = code;
            Name = name;
            ChooseLanguageText = chooseLanguageText;
            GetStartedText = getStartedText;
        }
    }
}