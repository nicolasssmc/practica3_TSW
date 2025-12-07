class Mensajes {

  logs = []
  errors = []
  messages = []

  constructor() {
    this.limpiar();
  }

  log(log) {
    this.logs.push(log);
  }

  error(error) {
    this.errors.push(error);
  }

  mensaje(message) {
    this.messages.push(message);
  }

  limpiar() {
    this.logs = [];
    this.errors = [];
    this.messages = [];
  }
}

export const mensajes = new Mensajes();
