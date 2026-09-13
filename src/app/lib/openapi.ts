export type OpenApiParameter = {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    default?: any;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    example?: any;
  };
};

export type OpenApiOperation = {
  tags?: string[];
  summary: string;
  description: string;
  operationId: string;
  parameters?: OpenApiParameter[];
  responses: Record<string, any>;
};

export type OpenApiSpec = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: { name: string; url: string };
    license?: { name: string; url: string };
  };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: Record<string, any>;
};

export const openApiSpec: OpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NITH Results API",
    version: "1.0.0",
    description:
      "Unofficial public REST API for NIT Hamirpur student examination results, rankings, CGPI/SGPI histories, and branch statistics.",
    contact: {
      name: "NITH Results",
      url: "https://github.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "https://results-nith.vercel.app",
      description: "Production API",
    },
    {
      url: "http://localhost:3000",
      description: "Local Development",
    },
  ],
  tags: [
    { name: "Search", description: "Search students by name or roll number" },
    { name: "Branches", description: "Department and academic branch metadata" },
    { name: "Results", description: "Student examination results, CGPI, and rankings" },
  ],
  paths: {
    "/api/branches": {
      get: {
        tags: ["Branches"],
        summary: "List all academic branches",
        description: "Returns all engineering departments and academic branches with branch codes and full names.",
        operationId: "getBranches",
        parameters: [],
        responses: {
          "200": {
            description: "List of academic branches",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Branch" },
                },
                example: [
                  {
                    branch_code: "bcs",
                    branch_name: "Computer Science & Engineering",
                  },
                  {
                    branch_code: "bee",
                    branch_name: "Electrical Engineering",
                  },
                ],
              },
            },
          },
          "500": {
            $ref: "#/components/responses/InternalError",
          },
        },
      },
    },
    "/api/search": {
      get: {
        tags: ["Search"],
        summary: "Search students",
        description: "Search students by prefix of roll number (case-insensitive) or substring of student name (minimum 2 characters).",
        operationId: "searchStudents",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query (minimum 2 characters), e.g. '20bcs' or 'Aryan'",
            schema: {
              type: "string",
              minLength: 2,
              example: "20bcs",
            },
          },
        ],
        responses: {
          "200": {
            description: "Matching students list (up to 8 results)",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudentSearchResult" },
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/InternalError",
          },
        },
      },
    },
    "/api/result": {
      get: {
        tags: ["Results"],
        summary: "List student leaderboard results",
        description: "Paginated list of student examination results sorted by CGPI descending.",
        operationId: "getResults",
        parameters: [
          {
            name: "skip",
            in: "query",
            required: false,
            description: "Number of records to skip for pagination",
            schema: {
              type: "integer",
              default: 0,
              minimum: 0,
              example: 0,
            },
          },
          {
            name: "take",
            in: "query",
            required: false,
            description: "Number of records to return (max 200)",
            schema: {
              type: "integer",
              default: 25,
              maximum: 200,
              example: 25,
            },
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of students with CGPI and rank summary",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudentLeaderboardItem" },
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/InternalError",
          },
        },
      },
    },
    "/api/result/{roll_no}": {
      get: {
        tags: ["Results"],
        summary: "Get single student result",
        description: "Returns full student profile, college/year/class rank badges, all semester SGPI/CGPI records, and subject grades.",
        operationId: "getStudentResult",
        parameters: [
          {
            name: "roll_no",
            in: "path",
            required: true,
            description: "Student roll number (case-insensitive), e.g. '20bcs017'",
            schema: {
              type: "string",
              example: "20bcs017",
            },
          },
        ],
        responses: {
          "200": {
            description: "Complete student examination profile and rank record",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudentDetail" },
              },
            },
          },
          "404": {
            description: "Student not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Student not found" },
                  },
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/InternalError",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Branch: {
        type: "object",
        properties: {
          branch_code: { type: "string", example: "bcs" },
          branch_name: { type: "string", example: "Computer Science & Engineering" },
        },
      },
      StudentSearchResult: {
        type: "object",
        properties: {
          rollno: { type: "string", example: "20bcs017" },
          name: { type: "string", example: "DIVYANSHU" },
          batch: { type: "string", example: "20" },
          branch_code: { type: "string", example: "bcs" },
          summary: {
            type: "object",
            nullable: true,
            properties: {
              cgpi: { type: "string", example: "9.58" },
              sgpi: { type: "string", example: "9.62" },
              semester: { type: "integer", example: 8 },
            },
          },
          branch: { $ref: "#/components/schemas/Branch" },
        },
      },
      StudentLeaderboardItem: {
        type: "object",
        properties: {
          rollno: { type: "string", example: "20bcs017" },
          name: { type: "string", example: "DIVYANSHU" },
          batch: { type: "string", example: "20" },
          branch_code: { type: "string", example: "bcs" },
          summary: {
            type: "object",
            properties: {
              cgpi: { type: "string", example: "9.58" },
              sgpi: { type: "string", example: "9.62" },
              semester: { type: "integer", example: 8 },
            },
          },
          rank: {
            type: "object",
            nullable: true,
            properties: {
              college_rank_cgpi: { type: "integer", example: 1 },
              year_rank_cgpi: { type: "integer", example: 1 },
              class_rank_cgpi: { type: "integer", example: 1 },
            },
          },
        },
      },
      StudentDetail: {
        type: "object",
        properties: {
          rollno: { type: "string", example: "20bcs017" },
          name: { type: "string", example: "DIVYANSHU" },
          fathers_name: { type: "string", example: "RAMESH KUMAR" },
          batch: { type: "string", example: "20" },
          branch_code: { type: "string", example: "bcs" },
          branch: { $ref: "#/components/schemas/Branch" },
          summary: {
            type: "object",
            properties: {
              cgpi: { type: "string", example: "9.58" },
              sgpi: { type: "string", example: "9.62" },
              semester: { type: "integer", example: 8 },
              sgpi_total: { type: "number", example: 178 },
              cgpi_total: { type: "number", example: 1705 },
            },
          },
          rank: {
            type: "object",
            properties: {
              college_rank_cgpi: { type: "integer", example: 1 },
              year_rank_cgpi: { type: "integer", example: 1 },
              class_rank_cgpi: { type: "integer", example: 1 },
            },
          },
          sem_summary: {
            type: "array",
            items: {
              type: "object",
              properties: {
                semester: { type: "integer", example: 1 },
                sgpi: { type: "string", example: "9.4" },
                cgpi: { type: "string", example: "9.4" },
              },
            },
          },
        },
      },
    },
    responses: {
      InternalError: {
        description: "Internal server or database error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string", example: "Database query failed" },
                message: { type: "string", example: "Connection refused" },
              },
            },
          },
        },
      },
    },
  },
};
