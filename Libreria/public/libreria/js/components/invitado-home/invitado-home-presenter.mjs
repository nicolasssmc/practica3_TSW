import { Presenter } from "../../commons/presenter.mjs";
import { InvitadoCatalogoLibroPresenter } from "../invitado-catalogo-libro/invitado-catalogo-libro-presenter.mjs";
import { MensajesPresenter } from "../mensajes/mensajes-presenter.mjs";

export class InvitadoHomePresenter extends Presenter {
  constructor(model, view) {
    super(model, view);
    this.mensajesPresenter = new MensajesPresenter(model, 'mensajes', '#mensajesContainer');
  }

  get catalogo() {
    return document.querySelector('#catalogo');
  }

  async refresh() {
    await super.refresh();
    await this.mensajesPresenter.refresh();
    let libros = await this.model.getLibros();

    // Importante!
    await Promise.all(libros.map(async (l) => { return await new InvitadoCatalogoLibroPresenter(l, 'invitado-catalogo-libro', '#catalogo').refresh() }));    
  }

}