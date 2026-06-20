import { getServicos } from "../actions/servicos";
import ServicosClient from "./ServicosClient";

export default async function ServicosPage() {
  const servicos = await getServicos();
  return <ServicosClient servicos={servicos} />;
}
