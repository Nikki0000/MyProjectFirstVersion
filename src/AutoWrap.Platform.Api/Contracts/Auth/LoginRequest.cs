using System.ComponentModel.DataAnnotations;

namespace AutoWrap.Platform.Api.Contracts.Auth;

public sealed class LoginRequest
{
    [Required(ErrorMessage = "Укажите email.")]
    [EmailAddress(ErrorMessage = "Некорректный формат email.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажите пароль.")]
    public string Password { get; set; } = string.Empty;
}
