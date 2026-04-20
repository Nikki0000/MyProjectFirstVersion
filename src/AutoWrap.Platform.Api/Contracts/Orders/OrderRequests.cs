using System.ComponentModel.DataAnnotations;
using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Contracts.Orders;

public sealed class CreateOrderRequest
{
    [Required(ErrorMessage = "Укажите заголовок заказа.")]
    [MinLength(5, ErrorMessage = "Заголовок должен быть не короче 5 символов.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажите описание заказа.")]
    [MinLength(10, ErrorMessage = "Описание должно быть не короче 10 символов.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажите город.")]
    public string City { get; set; } = string.Empty;

    [Range(1, double.MaxValue, ErrorMessage = "Бюджет должен быть больше 0.")]
    public decimal Budget { get; set; }
    public DateOnly? PlannedDate { get; set; }
}

public sealed class RespondToOrderRequest
{
    [Required(ErrorMessage = "Введите сообщение для отклика.")]
    [MinLength(5, ErrorMessage = "Сообщение должно быть не короче 5 символов.")]
    public string Message { get; set; } = string.Empty;

    [Range(1, double.MaxValue, ErrorMessage = "Предложенная цена должна быть больше 0.")]
    public decimal? ProposedPrice { get; set; }
}

public sealed class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
}
