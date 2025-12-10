import { model, ROL, connectDB, LibroModel, ClienteModel, AdminModel, FacturaModel } from './model.mjs';

// Funciones auxiliares de creación de datos (Mantén las tuyas, solo asegúrate de que devuelvan objetos JS planos)
export function crearLibro(isbn) {
  return {
    isbn: `${isbn}`,
    titulo: `TITULO_${isbn}`,
    autores: `AUTOR_A${isbn}; AUTOR_B${isbn}`,
    resumen: `Lorem ipsum..._[${isbn}]`,
    portada: `http://google.com/${isbn}`,
    stock: 5,
    precio: (Math.random() * 100).toFixed(2),
  };
}

function crearPersona(dni) {
  return {
    dni: `${dni}`,
    nombre: `Nombre ${dni}`,
    apellidos: `Apellido_1${dni} Apellido_2${dni}`,
    direccion: `Direccion ${dni}`,
    email: `${dni}@tsw.uclm.es`,
    password: `${dni}`,
  };
}

export async function seed() {
  // Asegurar conexión si se llama independientemente
  // (Si se llama desde app.mjs ya estará conectado, pero no hace daño)
  // await connectDB(); 

  console.log("Iniciando Seed...");

  // 1. Limpiar BD
  await LibroModel.deleteMany({});
  await ClienteModel.deleteMany({});
  await AdminModel.deleteMany({});
  await FacturaModel.deleteMany({});

  // 2. Insertar Libros
  const ISBNS = ['978-3-16-148410-0', '978-3-16-148410-1', '978-3-16-148410-2'];
  for (const isbn of ISBNS) {
      await model.addLibro(crearLibro(isbn));
  }

  // 3. Insertar Admins
  const A_DNIS = ['00000000A', '00000001A'];
  for (const dni of A_DNIS) {
      let admin = crearPersona(dni);
      admin.rol = ROL.ADMIN;
      await model.addUsuario(admin);
  }

  // 4. Insertar Clientes
  const C_DNIS = ['00000000C', '00000001C'];
  for (const dni of C_DNIS) {
      let cliente = crearPersona(dni);
      cliente.rol = ROL.CLIENTE;
      await model.addUsuario(cliente);
  }
  
  console.log("Seed completado.");
}