const request = require("supertest");
const app = require("../server");
const File = require("../models/File");
const path = require("path");
const { dbConnect, dbDisconnect } = require("../utils/test-utils/dbHandler");

beforeAll(async () => await dbConnect());
afterAll(async () => await dbDisconnect());

describe(" File Sharing API Tests", () => {
    let uploadedFileId;

   
    it("should upload a file successfully", async () => {
        const res = await request(app)
            .post("/upload")
            .attach("file", path.join(__dirname, "sample.txt")) 
            .field("password", "test123");

        expect(res.status).toBe(200);
        expect(res.text).toContain("/file/");

        const match = res.text.not.match(/\/file\/([a-zA-Z0-9]+)/);
        if (match) uploadedFileId = match[1];

        expect(uploadedFileId).toBeDefined();
    });

    
    it("should require a password for a protected file", async () => {
        const res = await request(app).get(`/file/${uploadedFileId}`);

        expect(res.status).toBe(200);
        expect(res.text).toContain("Enter Password");
    });

    
    it("should reject download with wrong password", async () => {
        const res = await request(app)
            .post(`/file/${uploadedFileId}`)
            .send({ password: "wrongpassword" });

        expect(res.status).toBe(200);
        expect(res.text).toContain("Incorrect password");
    });

    
    it("should allow file download with correct password", async () => {
        const res = await request(app)
            .post(`/file/${uploadedFileId}`)
            .send({ password: "test123" });

        expect(res.status).toBe(200);
        expect(res.header["content-disposition"]).toContain("attachment");
    });
});
