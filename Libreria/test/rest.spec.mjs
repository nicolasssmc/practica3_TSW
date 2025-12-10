import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from "../app.mjs";
import { crearLibro } from "../model/seeder.mjs";

chai.use(chaiHttp);
const expect = chai.expect;
const URL = '/api';

// Helpers para datos: Usamos timestamps para evitar errores de "Duplicate Key" si la BD no se limpia bien
const timestamp = Date.now();
const libroData = { isbn: `TEST-ALL-${timestamp}`, titulo: 'Test Completo', autores: 'Yo', precio: 10, stock: 100 };
const clienteData = { dni: `111C-${timestamp}`, nombre: 'Cliente', apellidos: 'Test', email: `c-${timestamp}@all.com`, password: '1234', rol: 'CLIENTE' };
const adminData = { dni: `222A-${timestamp}`, nombre: 'Admin', apellidos: 'Test', email: `a-${timestamp}@all.com`, password: '1234', rol: 'ADMIN' };

describe("REST libreria", function () {
    // Aumentamos timeout por si la BD tarda
    this.timeout(10000);

    // --- LIBROS (9 pruebas) ---
    describe("libros", function () {
        let id;
        it("DELETE /libros (removeLibros)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.delete(`${URL}/libros`);
            let response = await request.send();
            expect(response).to.have.status(200);

            request = requester.get(`${URL}/libros`);
            response = await request.send();
            expect(response.body).to.be.empty;
            requester.close();
        });

        it("POST /libros (addLibro)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.post(`${URL}/libros`);
            let response = await request.send(libroData);
            expect(response).to.have.status(201);
            id = response.body._id; // Guardamos ID para siguientes tests
            requester.close();
        });

        it("GET /libros (getLibros)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.get(`${URL}/libros`);
            let response = await request.send();
            expect(response).to.have.status(200);
            expect(response.body).to.have.lengthOf(1);
            requester.close();
        });

        it("GET /libros/:id (getLibroPorId)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.get(`${URL}/libros/${id}`);
            let response = await request.send();
            expect(response).to.have.status(200);
            expect(response.body.isbn).to.equal(libroData.isbn);
            requester.close();
        });

        it("GET /libros?isbn=... (getLibroPorIsbn)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.get(`${URL}/libros?isbn=${libroData.isbn}`);
            let response = await request.send();
            expect(response).to.have.status(200);
            // La API devuelve array al buscar por query params
            expect(response.body[0]._id).to.equal(id);
            requester.close();
        });

        it("GET /libros?titulo=... (getLibroPorTitulo)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.get(`${URL}/libros?titulo=${libroData.titulo}`);
            let response = await request.send();
            expect(response).to.have.status(200);
            expect(response.body[0]._id).to.equal(id);
            requester.close();
        });

        it("PUT /libros/:id (updateLibro)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.put(`${URL}/libros/${id}`);
            let response = await request.send({ precio: 99 });
            expect(response).to.have.status(200);
            expect(response.body.precio).to.equal(99);
            requester.close();
        });

        it("PUT /libros (setLibros)", async () => {
            let requester = chai.request(app).keepOpen();
            // Usamos ISBNs únicos para evitar choque
            const ts = Date.now();
            const nuevos = [
                { ...crearLibro('M1'), isbn: `M1-${ts}` }, 
                { ...crearLibro('M2'), isbn: `M2-${ts}` }
            ];
            let request = requester.put(`${URL}/libros`);
            let response = await request.send(nuevos);
            expect(response).to.have.status(200);
            expect(response.body).to.have.lengthOf(2);
            id = response.body[0]._id; // Actualizamos ID para test de borrado
            requester.close();
        });

        it("DELETE /libros/:id (removeLibro)", async () => {
            let requester = chai.request(app).keepOpen();
            let request = requester.delete(`${URL}/libros/${id}`);
            let response = await request.send();
            expect(response).to.have.status(200);
            requester.close();
        });
    });

    // --- CLIENTES (13 pruebas) ---
    describe("Clientes", () => {
        let id;
        it("DELETE /clientes (removeClientes)", async () => {
            const res = await chai.request(app).delete(`${URL}/clientes`);
            expect(res).to.have.status(200);
        });
        it("POST /clientes (addCliente)", async () => {
            const res = await chai.request(app).post(`${URL}/clientes`).send(clienteData);
            expect(res).to.have.status(201);
            id = res.body._id;
        });
        it("GET /clientes (getClientes)", async () => {
            const res = await chai.request(app).get(`${URL}/clientes`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.lengthOf(1);
        });
        it("GET /clientes/:id (getClientePorId)", async () => {
            const res = await chai.request(app).get(`${URL}/clientes/${id}`);
            expect(res).to.have.status(200);
        });
        it("GET /clientes?email=... (getClientePorEmail)", async () => {
            const res = await chai.request(app).get(`${URL}/clientes?email=${clienteData.email}`);
            expect(res).to.have.status(200);
            expect(res.body[0]._id).to.equal(id);
        });
        it("GET /clientes?dni=... (getClientePorDni)", async () => {
            const res = await chai.request(app).get(`${URL}/clientes?dni=${clienteData.dni}`);
            expect(res).to.have.status(200);
            expect(res.body[0]._id).to.equal(id);
        });
        it("PUT /clientes/:id (updateCliente)", async () => {
            const res = await chai.request(app).put(`${URL}/clientes/${id}`).send({ nombre: "Updated" });
            expect(res).to.have.status(200);
            expect(res.body.nombre).to.equal("Updated");
        });
        it("POST /clientes/autenticar", async () => {
            const res = await chai.request(app).post(`${URL}/clientes/autenticar`)
                .send({ email: clienteData.email, password: clienteData.password, rol: 'CLIENTE' });
            expect(res).to.have.status(200);
        });
        it("PUT /clientes (setClientes)", async () => {
            const res = await chai.request(app).put(`${URL}/clientes`).send([clienteData]);
            expect(res).to.have.status(200);
            expect(res.body).to.have.lengthOf(1);
            id = res.body[0]._id;
        });
        // Carrito
        it("POST /clientes/:id/carro/items", async () => {
            // Creamos libro para añadir
            const libroRes = await chai.request(app).post(`${URL}/libros`).send({ 
                isbn: `CARRO-${Date.now()}`, titulo: 'Libro Carro', precio: 50, stock: 10 
            });
            const res = await chai.request(app).post(`${URL}/clientes/${id}/carro/items`)
                .send({ libro: libroRes.body._id, cantidad: 1 });
            expect(res).to.have.status(201);
        });
        it("GET /clientes/:id/carro", async () => {
            const res = await chai.request(app).get(`${URL}/clientes/${id}/carro`);
            expect(res).to.have.status(200);
            expect(res.body.items).to.have.lengthOf(1);
        });
        it("PUT /clientes/:id/carro/items/:index", async () => {
            const res = await chai.request(app).put(`${URL}/clientes/${id}/carro/items/0`).send({ cantidad: 5 });
            expect(res).to.have.status(200);
        });
        it("DELETE /clientes/:id (removeCliente)", async () => {
            const res = await chai.request(app).delete(`${URL}/clientes/${id}`);
            expect(res).to.have.status(200);
        });
    });

    // --- ADMINISTRADORES (10 pruebas) ---
    describe("Administradores", () => {
        let id;
        it("DELETE /admins (removeAdmins)", async () => {
            const res = await chai.request(app).delete(`${URL}/admins`);
            expect(res).to.have.status(200);
        });
        it("POST /admins (addAdmin)", async () => {
            const res = await chai.request(app).post(`${URL}/admins`).send(adminData);
            expect(res).to.have.status(201);
            id = res.body._id;
        });
        it("GET /admins (getAdmins)", async () => {
            const res = await chai.request(app).get(`${URL}/admins`);
            expect(res).to.have.status(200);
            expect(res.body).to.have.lengthOf(1);
        });
        it("GET /admins/:id (getAdminPorId)", async () => {
            const res = await chai.request(app).get(`${URL}/admins/${id}`);
            expect(res).to.have.status(200);
        });
        it("GET /admins?email=... (getAdminPorEmail)", async () => {
            const res = await chai.request(app).get(`${URL}/admins?email=${adminData.email}`);
            expect(res).to.have.status(200);
            expect(res.body[0]._id).to.equal(id);
        });
        it("GET /admins?dni=... (getAdminPorDni)", async () => {
            const res = await chai.request(app).get(`${URL}/admins?dni=${adminData.dni}`);
            expect(res).to.have.status(200);
            expect(res.body[0]._id).to.equal(id);
        });
        it("PUT /admins/:id (updateAdmin)", async () => {
            const res = await chai.request(app).put(`${URL}/admins/${id}`).send({ nombre: "SuperAdmin" });
            expect(res).to.have.status(200);
            expect(res.body.nombre).to.equal("SuperAdmin");
        });
        it("POST /admins/autenticar", async () => {
            const res = await chai.request(app).post(`${URL}/admins/autenticar`)
                .send({ email: adminData.email, password: adminData.password, rol: 'ADMIN' });
            expect(res).to.have.status(200);
        });
        it("PUT /admins (setAdmins)", async () => {
            const res = await chai.request(app).put(`${URL}/admins`).send([adminData]);
            expect(res).to.have.status(200);
            id = res.body[0]._id;
        });
        it("DELETE /admins/:id (removeAdmin)", async () => {
            const res = await chai.request(app).delete(`${URL}/admins/${id}`);
            expect(res).to.have.status(200);
        });
    });

    // --- FACTURAS (6 pruebas) ---
    describe("Facturas", () => {
        let clienteId, libroId, facturaId;

        // Configuración previa para que las pruebas de facturas tengan datos reales
        before(async () => {
            const requester = chai.request(app).keepOpen();
            try {
                // 1. Limpiar (reset)
                await requester.delete(`${URL}/test-reset`);

                // 2. Crear Cliente
                const ts = Date.now();
                const cliRes = await requester.post(`${URL}/clientes`).send({
                    dni: `F-DNI-${ts}`, nombre: 'Fac', apellidos: 'Tura', email: `fac-${ts}@test.com`, password: '1234', rol: 'CLIENTE'
                });
                clienteId = cliRes.body._id;

                // 3. Crear Libro
                const libRes = await requester.post(`${URL}/libros`).send({
                    isbn: `F-ISBN-${ts}`, titulo: 'Libro Fac', precio: 10, stock: 100
                });
                libroId = libRes.body._id;

                // 4. Llenar Carro (Necesario para poder facturar)
                await requester.post(`${URL}/clientes/${clienteId}/carro/items`)
                    .send({ libro: libroId, cantidad: 1 });

            } finally { requester.close(); }
        });

        it("POST /facturas (facturarCompraCliente)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                const facturaData = { 
                    cliente: clienteId, 
                    razonSocial: "RS Test", 
                    direccion: "Dir Test",
                    dni: "123X",
                    email: "f@test.com"
                };
                const res = await requester.post(`${URL}/facturas`).send(facturaData);
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('numero');
                facturaId = res.body._id;
            } finally { requester.close(); }
        });

        it("GET /facturas (getFacturas)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                const res = await requester.get(`${URL}/facturas`);
                expect(res).to.have.status(200);
                expect(res.body.length).to.be.greaterThan(0);
            } finally { requester.close(); }
        });

        it("GET /facturas/:id (getFacturaPorId)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                const res = await requester.get(`${URL}/facturas/${facturaId}`);
                expect(res).to.have.status(200);
                expect(res.body._id).to.equal(facturaId);
            } finally { requester.close(); }
        });

        it("GET /facturas?cliente=... (getFacturasPorCliente)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                const res = await requester.get(`${URL}/facturas?cliente=${clienteId}`);
                expect(res).to.have.status(200);
                const found = res.body.find(f => f._id === facturaId);
                expect(found).to.exist;
            } finally { requester.close(); }
        });

        it("GET /facturas?numero=... (getFacturaPorNumero)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                // Recuperamos el número primero
                const getRes = await requester.get(`${URL}/facturas/${facturaId}`);
                const num = getRes.body.numero;

                const res = await requester.get(`${URL}/facturas?numero=${num}`);
                expect(res).to.have.status(200);
                expect(res.body[0]._id).to.equal(facturaId);
            } finally { requester.close(); }
        });

        it("DELETE /facturas (removeFacturas)", async () => {
             const requester = chai.request(app).keepOpen();
             try {
                 const res = await requester.delete(`${URL}/facturas`);
                 expect(res).to.have.status(200);
                 
                 const check = await requester.get(`${URL}/facturas`);
                 expect(check.body).to.be.empty;
             } finally { requester.close(); }
        });
    });

    // Limpieza final
    after(async function () {
        const requester = chai.request(app).keepOpen();
        await requester.delete(`${URL}/test-reset`);
        requester.close();
    });
});