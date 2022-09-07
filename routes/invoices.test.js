process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testInvoices;
beforeEach(async () => {
    const comp = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('razor', 'Razor', 'Software company') RETURNING code,name,description`) 
    const results = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('razor', 100, false, null) RETURNING comp_code,amt,paid,paid_date`)    
    testInvoices = results.rows[0]
    
    
})

afterEach(async () => {
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM companies')
    
    
})

afterAll(async () => {
    await db.end()
})

describe('GET /invoices', () =>{
    test('Get a list of invoices', async () => { 
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoices: [{add_date: expect.any(String), 
            amt: testInvoices.amt, comp_code: testInvoices.comp_code, 
            id: expect.any(Number), paid: testInvoices.paid, paid_date: testInvoices.paid_date }]})   
    })
    test('Responds with 404 if invoices are empty', async () => { 
        await db.query('DELETE FROM invoices')
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(404)

    })
})

 describe('GET /invoices/id', () => {
    test('Responds with 404 if invoice not found', async () => { 
        const res = await request(app).get('/invoices/0')
        expect(res.statusCode).toBe(404) 
    })
}) 

 describe('POST /invoices', () => {
    test('Creates a invoice', async () => { 
        const res = await request(app).post('/invoices').send({comp_code: testInvoices.comp_code, amt:1000})
        expect(res.statusCode).toBe(201) 
        expect(res.body).toEqual({invoice: {id: expect.any(Number), comp_code: testInvoices.comp_code, amt: 1000, 
            paid: false, add_date: expect.any(String), paid_date: null}})
    })
})

describe('PATCH /invoices/id', () => { 
  test('Responds with 404 if invoice not found', async () => { 
        const res = await request(app).patch('/invoices/0')
        expect(res.statusCode).toBe(404) 
    })
})

describe('DELETE /invoice/id', () => {
   
    test('Responds with 404 if a company is not found', async () => { 
        const res = await request(app).delete(`/invoices/0`)
        expect(res.statusCode).toBe(404)
       
    })
})  