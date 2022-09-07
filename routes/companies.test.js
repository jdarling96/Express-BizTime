process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testCompany;
beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('microsoft', 'Microsoft', 'Software company') RETURNING code,name,description`)
        testCompany = result.rows[0]
})

afterEach(async () => {
    await db.query('DELETE FROM companies')
})

afterAll(async () => {
    await db.end()
})

describe('GET /companies', () =>{
    test('Get a list of companies', async () => { 
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({companies: [testCompany]})   
    })
    test('Responds with 404 if companies are empty', async () => { 
        await db.query('DELETE FROM companies')
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(404)

    })
})

describe('GET /companies/code', () => {
    test('Get a company based on code', async () => { 
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: testCompany}) 
    })
    test('Responds with 404 if company not found', async () => { 
        const res = await request(app).get('/companies/0')
        expect(res.statusCode).toBe(404) 
    })
})

describe('POST /companies', () => {
    test('Creates a company', async () => { 
        const res = await request(app).post('/companies').send({code:'disney',name:'Disney',description:'Entertainment company'})
        expect(res.statusCode).toBe(201) 
        expect(res.body).toEqual({company: {code:'disney',name:'Disney',description:'Entertainment company'}})
    })
})

describe('PATCH /companies/code', () => { 
    test('Updates a company', async () => { 
        const res = await request(app).patch(`/companies/${testCompany.code}`).send({name: 'Microsoft', description:'Competes with apple'})
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: {code: testCompany.code, name: testCompany.name, description: 'Competes with apple'}}) 
    })
    test('Responds with 404 if compnay not found', async () => { 
        const res = await request(app).patch('/companies/0')
        expect(res.statusCode).toBe(404) 
    })
})

describe('DELETE /companies/code', () => {
    test('Deletes a company', async () => { 
        const res = await request(app).delete(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: 'Deleted'}) 
    })
    test('Responds with 404 if a company is not found', async () => { 
        const res = await request(app).delete(`/companies/0`)
        expect(res.statusCode).toBe(404)
        
    })
})