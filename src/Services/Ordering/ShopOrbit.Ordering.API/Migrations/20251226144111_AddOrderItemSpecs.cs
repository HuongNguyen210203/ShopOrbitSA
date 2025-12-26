using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShopOrbit.Ordering.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderItemSpecs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Dictionary<string, string>>(
                name: "Specifications",
                table: "OrderItems",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "OrderItems");
        }
    }
}
