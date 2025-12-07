import { Presenter } from "../../commons/presenter.mjs";
// import { Router } from "../../commons/router.mjs";
import { mensajes } from "../../commons/mensajes.mjs";

export class MensajesPresenter extends Presenter {
  constructor(model, view, parent) {
    super(model, view, parent);
  }

  messageHTML(message) {
    return `<div class="message" style="display:flex; justify-content: space-between;" ><span> ${message}</span><span onclick="event.target.parentElement.remove()" class="x">X</span></div>`
  }
  logHTML(message) {
    return `<div class="log" style="display:flex; justify-content: space-between;" ><span> ${message}</span><span onclick="event.target.parentElement.remove()" class="x">X</span></div>`
  }
  errorHTML(message) {
    return `<div class="error" style="display:flex; justify-content: space-between;" ><span> ${message}</span><span onclick="event.target.parentElement.remove()" class="x">X</span></div>`
  }

  get messagesDiv() {
    return document.querySelector('#mensajes');
  }

  addMensajeHTML(message) {
    this.messagesDiv.innerHTML = this.messagesDiv.innerHTML + this.messageHTML(message);
  }

  addLogHTML(log) {
    this.messagesDiv.innerHTML = this.messagesDiv.innerHTML + this.logHTML(log);
  }

  addErrorHTML(error) {
    this.messagesDiv.innerHTML = this.messagesDiv.innerHTML + this.errorHTML(error);
  }


  refreshMensajes() {
    this.messagesDiv.innerHTML = '';
    mensajes.errors.forEach(m => {
      this.addErrorHTML(m);
    });
    mensajes.messages.forEach(m => {
      this.addMensajeHTML(m);
    });
    mensajes.logs.forEach(m => {
      this.addLogHTML(m);
    });
  }

  log(mensaje) { mensajes.log(mensaje); }
  error(mensaje) { mensajes.error(mensaje); }
  mensaje(mensaje) { mensajes.mensaje(mensaje); }
  limpiarMensajes() { mensajes.limpiar(); }

  async refresh() {
    await super.refresh();
    this.refreshMensajes();
    this.limpiarMensajes();
  }

}