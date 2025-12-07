import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";

export class AdminModificarLibroPresenter extends Presenter {
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

  get isbnInput() { return document.querySelector('#isbnInput'); }
  get isbnInputText() { return this.isbnInput.value; }

  get tituloArea() { return document.querySelector('#tituloArea'); }
  get tituloAreaText() { return this.tituloArea.textContent; }

  get autoresArea() { return document.querySelector('#autoresArea'); }
  get autoresAreaText() { return this.autoresArea.textContent; }

  get resumenArea() { return document.querySelector('#resumenArea'); }
  get resumenAreaText() { return this.resumenArea.textContent; }

  get stockInput() { return document.querySelector('#stockInput'); }
  get stockInputText() { return this.stockInput.value; }

  get precioInput() { return document.querySelector('#precioInput'); }
  get precioInputText() { return this.precioInput.value; }

  get modificarInput() { return document.querySelector('#modificarInput'); }

  set libro(libro) {
    this.isbnInput.value = libro.isbn;
    this.tituloArea.value = libro.titulo;
    this.autoresArea.value = libro.autores;
    this.resumenArea.value = libro.resumen;
    this.stockInput.value = libro.stock;
    this.precioInput.value = libro.precio;
  }

  async modificarClick(event) {
    event.preventDefault();

    let libroModificado = {
      _id: this.id,
      isbn: this.isbnInput.value,
      titulo: this.tituloArea.value,
      autores: this.autoresArea.value,
      resumen: this.resumenArea.value,
      stock: parseInt(this.stockInput.value),
      precio: parseFloat(this.precioInput.value)
    };

    try {
      await this.model.updateLibro(libroModificado);
      this.mensajesPresenter.mensaje('¡Libro modificado exitosamente!');
      router.navigate('/libreria/admin-home.html');
    } catch (err) {
      console.error(err);
      this.mensajesPresenter.error(err.message || "Error al modificar el libro");
      await this.mensajesPresenter.refresh();
    }
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    try {
        const libro = await this.getLibro();
        
        if (libro) {
            this.libro = libro;
            // Asignar evento solo si todo cargó bien
            if (this.modificarInput) {
                this.modificarInput.onclick = (event) => this.modificarClick(event);
            }
        } else {
            this.mensajesPresenter.error("Libro no encontrado");
        }
    } catch (e) {
        console.error(e);
        this.mensajesPresenter.error(e.message || "Error al cargar datos del libro");
    }
  }
}