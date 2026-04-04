namespace ExcelClone.Api.Services;

public static class RoleHelper
{
    public static string ToStoredRole(string role) => role.Trim() switch
    {
        "Admin" => "Role_Admin",
        "Manager" => "Role_Manager",
        "User" => "Role_User",
        "Role_Admin" => "Role_Admin",
        "Role_Manager" => "Role_Manager",
        "Role_User" => "Role_User",
        _ => string.Empty
    };

    public static string ToDisplayRole(string storedRole) => storedRole switch
    {
        "Role_Admin" => "Admin",
        "Role_Manager" => "Manager",
        "Role_User" => "User",
        _ => string.Empty
    };

    public static bool CanCreateRole(string creatorStoredRole, string targetStoredRole) =>
        creatorStoredRole switch
        {
            "Role_Admin" => targetStoredRole is "Role_Admin" or "Role_Manager" or "Role_User",
            "Role_Manager" => targetStoredRole == "Role_User",
            _ => false
        };
}
