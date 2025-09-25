import API from "./api";

export interface IOrganization {
  id?: number;
  name: string;
  logoUrl?: string;
  created_at?: string;
}

export const getOrganizations = async () => {
  const res = await API.get("/organizations");
  return res.data.data;
};
export const getOrganization = (id: number) =>
  API.get<IOrganization>(`/organizations/${id}`);
export const createOrganization = (data: Partial<IOrganization>) =>
  API.post("/organizations", data);
export const updateOrganization = (id: number, data: Partial<IOrganization>) =>
  API.put(`/organizations/${id}`, data);
export const deleteOrganization = (id: number) =>
  API.delete(`/organizations/${id}`);
