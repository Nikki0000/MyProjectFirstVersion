using System.ComponentModel.DataAnnotations;
using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Contracts.Auth;

public sealed class RegisterRequest
{
    [Required(ErrorMessage = "Укажите email.")]
    [EmailAddress(ErrorMessage = "Некорректный формат email.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажите имя.")]
    [MinLength(2, ErrorMessage = "Имя должно быть не короче 2 символов.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажите пароль.")]
    [MinLength(6, ErrorMessage = "Пароль должен быть не короче 6 символов.")]
    public string Password { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Customer;
}
