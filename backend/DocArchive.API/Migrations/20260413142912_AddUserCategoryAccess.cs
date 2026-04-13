using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocArchive.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCategoryAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsUserAccessible",
                table: "Categories");

            migrationBuilder.CreateTable(
                name: "UserCategoryAccess",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCategoryAccess", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCategoryAccess_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCategoryAccess_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryAccess_CategoryId",
                table: "UserCategoryAccess",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCategoryAccess_UserId_CategoryId",
                table: "UserCategoryAccess",
                columns: new[] { "UserId", "CategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCategoryAccess");

            migrationBuilder.AddColumn<bool>(
                name: "IsUserAccessible",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
