import API from "./api";

export interface IOrganization {
  id?: number;
  name: string;
  logoUrl?: string;
  created_at?: string;
}

export const getOrganizations = async () => {
  const res = await API.get("/api/organizations");
  return res.data.data;
};
export const getOrganization = (id: number) =>
  API.get<IOrganization>(`/api/organizations/${id}`);
export const createOrganization = (data: Partial<IOrganization>) =>
  API.post("/api/organizations", data);
export const updateOrganization = (id: number, data: Partial<IOrganization>) =>
  API.put(`/api/organizations/${id}`, data);
export const deleteOrganization = (id: number) =>
  API.delete(`/api/organizations/${id}`);
