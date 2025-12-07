import { Presenter } from "../../commons/presenter.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";
import { libreriaSession } from "../../commons/libreria-session.mjs";
import { router } from "../../commons/router.mjs";

export class ClienteVerLibroPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get searchParams() {
    return new URLSearchParams(document.location.search);
  }

  get id() {
    return this.searchParams.get('id');
  }

  getLibro() {
    return this.model.getLibroPorId(this.id);
  }

  get isbnText() {
    return document.querySelector('#isbnText');
  }

  set isbn(isbn) {
    this.isbnText.textContent = isbn;
  }

  get tituloText() {
    return document.querySelector('#tituloText');
  }

  set titulo(titulo) {
    this.tituloText.textContent = titulo;
  }

  get autoresText() {
    return document.querySelector('#autoresText');
  }

  set autores(autores) {
    this.autoresText.textContent = autores;
  }

  get resumenText() {
    return document.querySelector('#resumenText');
  }

  set resumen(resumen) {
    this.resumenText.textContent = resumen;
  }

  get precioText() {
    return document.querySelector('#precioText');
  }

  set precio(precio) {
    this.precioText.textContent = precio;
  }

  get stockText() {
    return document.querySelector('#stockText');
  }

  set stock(stock) {
    this.stockText.textContent = stock;
  }

  get agregarCarroInput() {
    return document.querySelector('#agregarCarroInput');
  }

  set libro(libro) {
    this.isbn = libro.isbn;
    this.titulo = libro.titulo;
    this.autores = libro.autores;
    this.resumen = libro.resumen;
    this.stock = libro.stock;
    this.precio = libro.precio;
  }

  async agregarCarroClick(event) {
    event.preventDefault();
    try {
      const clienteId = libreriaSession.getUsuarioId();
      await this.model.addClienteCarroItem(clienteId, {
        libro: this.id,
        cantidad: 1
      });

      this.mensajesPresenter.mensaje("Libro añadido al carro");
      router.navigate('/libreria/cliente-carro.html');
    } catch (error) {
      console.error(error);
      this.mensajesPresenter.error("Error al añadir al carro");
    }
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
      // Intentamos obtener el libro
      const libro = await this.getLibro();
      this.libro = libro;
      
      // Activamos el botón solo si todo ha ido bien
      if (this.agregarCarroInput) {
        this.agregarCarroInput.onclick = (event) => this.agregarCarroClick(event);
      }
    } catch (e) {
      // Si falla (ej. 404 Not Found), capturamos el error aquí
      console.error(e);
      this.mensajesPresenter.error(`Libro ${this.id} no encontrado o error de conexión`);
    }
  }
}
