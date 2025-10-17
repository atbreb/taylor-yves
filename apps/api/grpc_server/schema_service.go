package grpc_server

import (
	"context"
	"fmt"

	"agentic-template/api/db"
	"agentic-template/api/pb"
	"agentic-template/api/schema_manager"
)

// SchemaServiceServer implements the SchemaService gRPC service
type SchemaServiceServer struct {
	pb.UnimplementedSchemaServiceServer
	schemaManager *schema_manager.SchemaManager
}

// NewSchemaServiceServer creates a new schema service server
func NewSchemaServiceServer(database *db.DB) *SchemaServiceServer {
	return &SchemaServiceServer{
		schemaManager: schema_manager.NewSchemaManager(database.Pool),
	}
}

// CreateTable handles table creation requests
func (s *SchemaServiceServer) CreateTable(ctx context.Context, req *pb.CreateTableRequest) (*pb.CreateTableResponse, error) {
	// Convert protobuf request to internal type
	columns := make([]schema_manager.ColumnDefinition, 0, len(req.Columns))
	for _, col := range req.Columns {
		colDef := schema_manager.ColumnDefinition{
			Name:       col.Name,
			DataType:   schema_manager.DataType(col.DataType),
			IsNullable: col.IsNullable,
			IsUnique:   col.IsUnique,
		}

		if col.DefaultValue != nil {
			colDef.DefaultValue = col.DefaultValue
		}

		if col.ForeignKeyToTableId != nil {
			tableID := int(*col.ForeignKeyToTableId)
			colDef.ForeignKeyToTableID = &tableID
		}

		columns = append(columns, colDef)
	}

	createReq := schema_manager.CreateTableRequest{
		Name:    req.Name,
		Columns: columns,
	}

	if req.Description != nil {
		createReq.Description = req.Description
	}

	// Call the schema manager
	tableDef, err := s.schemaManager.CreateTable(ctx, createReq, "system") // TODO: Get actual user ID
	if err != nil {
		return &pb.CreateTableResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to create table: %v", err),
		}, nil // Return error in response, not as gRPC error
	}

	// Convert response back to protobuf
	pbTableDef := convertTableDefinitionToPb(tableDef)

	return &pb.CreateTableResponse{
		Success: true,
		Message: fmt.Sprintf("Table '%s' created successfully", tableDef.Name),
		Table:   pbTableDef,
	}, nil
}

// GetTable retrieves a table definition
func (s *SchemaServiceServer) GetTable(ctx context.Context, req *pb.GetTableRequest) (*pb.GetTableResponse, error) {
	tableDef, err := s.schemaManager.GetTable(ctx, int(req.TableId))
	if err != nil {
		return &pb.GetTableResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get table: %v", err),
		}, nil
	}

	pbTableDef := convertTableDefinitionToPb(tableDef)

	return &pb.GetTableResponse{
		Success: true,
		Message: "Table retrieved successfully",
		Table:   pbTableDef,
	}, nil
}

// ListTables returns all user-defined tables
func (s *SchemaServiceServer) ListTables(ctx context.Context, req *pb.ListTablesRequest) (*pb.ListTablesResponse, error) {
	tables, err := s.schemaManager.ListTables(ctx)
	if err != nil {
		return &pb.ListTablesResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to list tables: %v", err),
		}, nil
	}

	pbTables := make([]*pb.TableDefinition, 0, len(tables))
	for _, table := range tables {
		pbTables = append(pbTables, convertTableDefinitionToPb(&table))
	}

	return &pb.ListTablesResponse{
		Success: true,
		Message: fmt.Sprintf("Found %d table(s)", len(tables)),
		Tables:  pbTables,
	}, nil
}

// GetDataTypes returns information about available data types
func (s *SchemaServiceServer) GetDataTypes(ctx context.Context, req *pb.GetDataTypesRequest) (*pb.GetDataTypesResponse, error) {
	dataTypeInfo := schema_manager.GetAllDataTypeInfo()

	pbDataTypes := make([]*pb.DataTypeInfo, 0, len(dataTypeInfo))
	for _, info := range dataTypeInfo {
		pbDataTypes = append(pbDataTypes, &pb.DataTypeInfo{
			Type:         string(info.Type),
			DisplayName:  info.DisplayName,
			Description:  info.Description,
			PostgresType: info.PostgresType,
		})
	}

	return &pb.GetDataTypesResponse{
		Success:   true,
		DataTypes: pbDataTypes,
	}, nil
}

// DeleteTable handles table deletion (placeholder for now)
func (s *SchemaServiceServer) DeleteTable(ctx context.Context, req *pb.DeleteTableRequest) (*pb.DeleteTableResponse, error) {
	// TODO: Implement table deletion
	return &pb.DeleteTableResponse{
		Success: false,
		Message: "Table deletion not yet implemented",
	}, nil
}

// Helper function to convert internal TableDefinition to protobuf
func convertTableDefinitionToPb(table *schema_manager.TableDefinition) *pb.TableDefinition {
	columns := make([]*pb.ColumnDetail, 0, len(table.Columns))
	for _, col := range table.Columns {
		pbCol := &pb.ColumnDetail{
			Id:           int32(col.ID),
			Name:         col.Name,
			ColumnName:   col.ColumnName,
			DataType:     string(col.DataType),
			PostgresType: col.PostgresType,
			IsNullable:   col.IsNullable,
			IsUnique:     col.IsUnique,
			DisplayOrder: int32(col.DisplayOrder),
		}

		if col.DefaultValue != nil {
			pbCol.DefaultValue = col.DefaultValue
		}

		if col.ForeignKeyToTableID != nil {
			fkID := int32(*col.ForeignKeyToTableID)
			pbCol.ForeignKeyToTableId = &fkID
		}

		if col.ForeignKeyToTableName != nil {
			pbCol.ForeignKeyToTableName = col.ForeignKeyToTableName
		}

		columns = append(columns, pbCol)
	}

	pbTable := &pb.TableDefinition{
		Id:        int32(table.ID),
		Name:      table.Name,
		TableName: table.TableName,
		Columns:   columns,
		CreatedAt: table.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: table.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	if table.Description != nil {
		pbTable.Description = table.Description
	}

	return pbTable
}
