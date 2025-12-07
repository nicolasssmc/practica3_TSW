import chai from 'chai';
import chaiHttp from 'chai-http';
import { app } from "../app.mjs";
import { crearLibro } from "../model/seeder.mjs";

chai.use(chaiHttp);
const expect = chai.expect;
const URL = '/api';

// Helpers
const libroData = { isbn: 'TEST-ALL', titulo: 'Test Completo', autores: 'Yo', precio: 10, stock: 100 };
const clienteData = { dni: '111C', nombre: 'Cliente', apellidos: 'Test', email: 'c@all.com', password: '123', rol: 'CLIENTE' };
const adminData = { dni: '222A', nombre: 'Admin', apellidos: 'Test', email: 'a@all.com', password: '123', rol: 'ADMIN' };

// Para facturas
const LIBRO_TEST = { 
    isbn: 'TEST-001', titulo: 'Libro Test', autores: 'Autor Test', precio: 10, stock: 5 
};
const CLIENTE_TEST = { 
    dni: '1111A', nombre: 'Cli', apellidos: 'Ente', direccion: 'Casa', email: 'c@test.com', password: '123', rol: 'CLIENTE' 
};
const ADMIN_TEST = { 
    dni: '2222B', nombre: 'Adm', apellidos: 'In', direccion: 'Oficina', email: 'a@test.com', password: '123', rol: 'ADMIN' 
};

describe("REST libreria", function () {
    // --- LIBROS ---
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
            id = response.body._id;
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
            const nuevos = [crearLibro('M1'), crearLibro('M2')];
            let request = requester.put(`${URL}/libros`);
            let response = await request.send(nuevos);
            expect(response).to.have.status(200);
            expect(response.body).to.have.lengthOf(2);
            id = response.body[0]._id; // Actualizamos ID para siguientes
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

    // --- CLIENTES ---
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
            id = res.body[0]._id; // Actualizar ID
        });
        // Carrito
        it("POST /clientes/:id/carro/items", async () => {
            // Necesitamos un libro
            const l = await chai.request(app).post(`${URL}/libros`).send(libroData);
            const res = await chai.request(app).post(`${URL}/clientes/${id}/carro/items`)
                .send({ libro: l.body._id, cantidad: 1 });
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

    // --- ADMINISTRADORES ---
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

    // --- FACTURAS ---
    describe("Facturas", () => {
        let clienteId, libroId, facturaId;

        // SETUP ROBUSTO: Creamos todo desde cero para este bloque
        before(async () => {
            const requester = chai.request(app).keepOpen();
            try {
                // 1. Crear Cliente Exclusivo para Facturas
                const cliRes = await requester.post(`${URL}/clientes`).send({
                    ...CLIENTE_TEST, 
                    email: 'factura_user@test.com', 
                    dni: 'FAC001'
                });
                clienteId = cliRes.body._id;

                // 2. Crear Libro Exclusivo
                const libRes = await requester.post(`${URL}/libros`).send({
                    ...LIBRO_TEST, 
                    isbn: 'FAC-BOOK', 
                    stock: 100
                });
                libroId = libRes.body._id;

                // 3. LLENAR EL CARRO (Crucial para evitar el error 400)
                const addRes = await requester.post(`${URL}/clientes/${clienteId}/carro/items`)
                    .send({ libro: libroId, cantidad: 1 });
                
                if(addRes.status !== 201) throw new Error("Falló setup carrito");

            } finally { requester.close(); }
        });

        it("POST /facturas (facturarCompraCliente)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                const facturaData = { 
                    cliente: clienteId, 
                    nombre: "Factura Test", 
                    direccion: "Dir Test"
                };
                const res = await requester.post(`${URL}/facturas`).send(facturaData);
                
                // Ahora el carro tiene items, así que debe devolver 201
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
                expect(res.body).to.be.an('array');
                // Debe haber al menos la que acabamos de crear
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
                const encontrada = res.body.find(f => f._id === facturaId);
                expect(encontrada).to.exist;
            } finally { requester.close(); }
        });

        it("GET /facturas?numero=... (getFacturaPorNumero)", async () => {
            const requester = chai.request(app).keepOpen();
            try {
                // Obtenemos el número real de la factura creada
                const getRes = await requester.get(`${URL}/facturas/${facturaId}`);
                const num = getRes.body.numero;

                const res = await requester.get(`${URL}/facturas?numero=${num}`);
                expect(res).to.have.status(200);
                expect(res.body[0]._id).to.equal(facturaId);
            } finally { requester.close(); }
        });

        it("DELETE /facturas (removeFacturas) - Limpieza", async () => {
             const requester = chai.request(app).keepOpen();
             try {
                 const res = await requester.delete(`${URL}/facturas`);
                 expect(res).to.have.status(200);
                 
                 const check = await requester.get(`${URL}/facturas`);
                 expect(check.body).to.be.empty;
             } finally { requester.close(); }
        });
    });

    // --- BLOQUE DE LIMPIEZA FINAL ---
    after(async function () {
        const requester = chai.request(app).keepOpen();
        try {
            // Llamamos a la ruta especial que borra TODO y pone contadores a 0
            await requester.delete(`${URL}/test-reset`);
            console.log("\t✔ Base de datos y contadores reseteados a 0.");
        } catch (error) {
            console.error("Error limpiando la base de datos:", error);
        } finally {
            requester.close();
        }
    });
});