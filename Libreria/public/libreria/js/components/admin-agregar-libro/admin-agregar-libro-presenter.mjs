import { Presenter } from "../../commons/presenter.mjs";
import { router } from "../../commons/router.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";

export class AdminAgregarLibroPresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
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

  get agregarInput() { return document.querySelector('#agregarInput'); }

  async agregarClick(event) {
    event.preventDefault();
    console.log('Prevented!', event);

    // CORRECCIÓN: Limpiamos la creación del objeto (había isbn duplicado)
    let obj = {
      isbn: this.isbnInput.value.trim(),
      titulo: this.tituloArea.value.trim(),
      autores: this.autoresArea.value.trim(),
      resumen: this.resumenArea.value.trim(),
      stock: parseInt(this.stockInput.value) || 0,
      precio: parseFloat(this.precioInput.value) || 0.0
    };

    console.log("Agregar libro:", JSON.stringify(obj, null, 2));

    try {
      // await es correcto aquí porque el Proxy devuelve promesa
      await this.model.addLibro(obj);
      
      this.mensajesPresenter.mensaje('Libro agregado con éxito!');
      // Esperamos un poco para que se vea el mensaje o redirigimos directamente
      router.navigate('/libreria/admin-home.html');
    } catch (err) {
      console.error(err);
      // Aseguramos mostrar el mensaje del error (ej. "ISBN duplicado")
      this.mensajesPresenter.error(err.message || "Error al agregar el libro");
    }
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();

    if (this.agregarInput) {
        this.agregarInput.onclick = event => this.agregarClick(event);
    }
  }
}