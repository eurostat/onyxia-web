import type { KcLanguageTag } from "keycloakify";

export type User = {
    email: string;
    familyName: string; //Obama
    firstName: string; //Barack
    username: string; //obarack, the idep
    groups: string[];
    local: KcLanguageTag;
};

export type UserApiClient = {
    getUser: () => Promise<User>;
};
