import { ROL } from "../model/proxy.mjs";

const USUARIO_ID = 'USUARIO_ID';
const USUARIO_ROL = 'USUARIO_ROL';

class LibreriaSession {

  formatoMoneda;

  constructor() {
    this.formatoMoneda = Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits:2,
      currencySign: "accounting",
    });
  }

  ingreso(usuario) {
    this.setUsuarioId(usuario._id);
    this.setUsuarioRol(usuario.rol);
  }

  setUsuarioId(id) { sessionStorage.setItem(USUARIO_ID, id); }
  getUsuarioId() {
    if (this.esInvitado()) throw new Error('Es un invitado');
    return sessionStorage.getItem(USUARIO_ID);
  }

  setUsuarioRol(rol) { sessionStorage.setItem(USUARIO_ROL, rol); }
  getUsuarioRol() { return sessionStorage.getItem(USUARIO_ROL); }

  salir() {
    sessionStorage.removeItem(USUARIO_ID);
    sessionStorage.removeItem(USUARIO_ROL);
  }

  esInvitado() { return !this.getUsuarioRol(); }
  esCliente() { return !this.esInvitado() && this.getUsuarioRol() == ROL.CLIENTE; }
  esAdmin() { return !this.esInvitado() && this.getUsuarioRol() == ROL.ADMIN; }

  formatearMoneda(valor) {

    return this.formatoMoneda.format(valor);
  }
}

export let libreriaSession = new LibreriaSession();