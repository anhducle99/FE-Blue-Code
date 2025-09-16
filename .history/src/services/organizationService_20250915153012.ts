import API from "./api";

export interface IOrganization {
  id?: number;
  name: string;
  created_at?: string;
}

export const getOrganizations = (token: string) =>
  API.get<IOrganization[]>("/organizations", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createOrganization = (
  organization: IOrganization,
  token: string
) =>
  API.post("/organizations", organization, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateOrganization = (
  id: number,
  organization: Partial<IOrganization>,
  token: string
) =>
  API.put(`/organizations/${id}`, organization, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteOrganization = (id: number, token: string) =>
  API.delete(`/organizations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
