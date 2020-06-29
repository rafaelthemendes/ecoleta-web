import { LeafletMouseEvent } from "leaflet";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Map, Marker, TileLayer } from "react-leaflet";
import { Link, useHistory } from "react-router-dom";
import logo from "../../assets/logo.svg";
import api from "../../services/api";
import "./styles.css";

interface Item {
  id: number;
  title: string;
  imageUrl: string;
}

interface IBGEUfsResponse {
  sigla: string;
}

interface IBGECitiesResponse {
  nome: string;
}

const DEFAULT_POSITION: [number, number] = [-3.7744561, -38.6061587];

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [selectedUf, setSelectedUf] = useState("0");
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("0");
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(
    DEFAULT_POSITION
  );
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>(
    DEFAULT_POSITION
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition([latitude, longitude]);
        setSelectedPosition([latitude, longitude]);
      },
      () => {
        setCurrentPosition(DEFAULT_POSITION);
      }
    );
  }, []);

  useEffect(() => {
    api.get("items").then(({ data }) => {
      setItems(data);
    });
  }, []);

  useEffect(() => {
    api
      .get<IBGEUfsResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
      )
      .then(({ data }) => {
        setUfs(data.map((item) => item.sigla));
      });
  }, []);

  useEffect(() => {
    setSelectedCity("0");

    if (selectedUf === "0") {
      return setCities([]);
    }

    api
      .get<IBGECitiesResponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
      )
      .then(({ data }) => {
        setCities(data.map((item) => item.nome));
      });
  }, [selectedUf]);

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUf(event.target.value);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSelectItem(itemId: number) {
    const alreadySelectedIndex = selectedItems.findIndex(
      (item) => item === itemId
    );
    if (alreadySelectedIndex === -1) {
      return setSelectedItems([...selectedItems, itemId]);
    }
    setSelectedItems(selectedItems.filter((item) => item !== itemId));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (selectedUf === "0" || selectedCity === "0") {
      return alert("Nos diga o endereço");
    }

    if (!selectedItems.length) {
      return alert("Selecione pelo menos 1 item de coleta");
    }

    const { name, email, whatsapp } = formData;
    const [latitude, longitude] = selectedPosition;
    const data = {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city: selectedCity,
      uf: selectedUf,
      items: selectedItems,
    };

    try {
      await api.post("/points", data);
    } catch {
      alert(
        "Ops! Não foi possível criar o novo ponto de coleta. Verifique as informações e tente novamente."
      );
    }

    alert("Seu ponto foi cadastrado. Obrigado!");

    history.push("/");
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastre seu ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={currentPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedPosition && <Marker position={selectedPosition} />}
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                onChange={handleSelectUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma Cidade</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(({ id, imageUrl, title }) => (
              <li
                key={id}
                onClick={() => handleSelectItem(id)}
                className={selectedItems.includes(id) ? "selected" : ""}
              >
                <img src={imageUrl} alt={title} />
                <span>{title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
