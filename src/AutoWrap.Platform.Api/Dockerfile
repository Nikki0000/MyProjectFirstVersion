FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj", "src/AutoWrap.Platform.Api/"]
RUN dotnet restore "src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj"

COPY . .
WORKDIR /src/src/AutoWrap.Platform.Api
RUN dotnet publish "AutoWrap.Platform.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AutoWrap.Platform.Api.dll"]
