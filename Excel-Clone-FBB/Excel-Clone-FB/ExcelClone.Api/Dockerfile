FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["ExcelClone.Api.csproj", "./"]
RUN dotnet restore "./ExcelClone.Api.csproj"

COPY . .
RUN dotnet publish "./ExcelClone.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "ExcelClone.Api.dll"]
