/* eslint-disable react-hooks/rules-of-hooks */
import type { Action, ThunkAction as GenericThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import { createLocalStorageSecretManagerClient } from "./secondaryAdapters/localStorageSecretsManagerClient";
import { createVaultSecretsManagerClient } from "./secondaryAdapters/vaultSecretsManagerClient";
import { createJwtUserApiClient } from "./secondaryAdapters/jwtUserApiClient";
import { createMinioS3Client } from "./secondaryAdapters/minioS3Client";
import { createDummyS3Client } from "./secondaryAdapters/dummyS3Client";
import * as catalogExplorerUseCase from "./usecases/catalogExplorer";
import * as deploymentRegionUseCase from "./usecases/deploymentRegion";
import * as explorersUseCase from "./usecases/explorers";
import * as launcherUseCase from "./usecases/launcher";
import * as projectConfigUseCase from "./usecases/projectConfigs";
import * as projectSelectionUseCase from "./usecases/projectSelection";
import * as publicIpUseCase from "./usecases/publicIp";
import * as restorablePackageConfigsUseCase from "./usecases/restorablePackageConfigs";
import * as runningServiceUseCase from "./usecases/runningService";
import * as secretExplorerUseCase from "./usecases/secretExplorer";
import * as userAuthenticationUseCase from "./usecases/userAuthentication";
import * as userConfigsUseCase from "./usecases/userConfigs";

import type { UserApiClient, User } from "./ports/UserApiClient";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import type { S3Client } from "./ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import { Deferred } from "evt/tools/Deferred";
import { createObjectThatThrowsIfAccessed } from "./tools/createObjectThatThrowsIfAccessed";
import { createKeycloakOidcClient } from "./secondaryAdapters/keycloakOidcClient";
import {
    createPhonyOidcClient,
    phonyClientOidcClaims,
} from "./secondaryAdapters/phonyOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import type { OnyxiaApiClient } from "./ports/OnyxiaApiClient";
import { createMockOnyxiaApiClient } from "./secondaryAdapters/mockOnyxiaApiClient";
import { createOfficialOnyxiaApiClient } from "./secondaryAdapters/officialOnyxiaApiClient";
import type { Param0, Equals } from "tsafe";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { KcLanguageTag } from "keycloakify";
import { usecasesToReducer } from "clean-redux";
import { createMiddlewareEvtActionFactory } from "clean-redux/middlewareEvtAction";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as user from "js/redux/user";
import * as app from "js/redux/app";

export type CreateStoreParams = {
    /**
     * not that we are going to change anything about the UI from src/core
     * but we want to be able to provide a good default for state.userConfigs.isDarkModeEnabled
     * when it's the first time the user logs in and the value hasn't been stored yet in vault.
     * */
    getIsDarkModeEnabledValueForProfileInitialization: () => boolean;
    oidcClientConfig: OidcClientConfig;
    onyxiaApiClientConfig: OnyxiaApiClientConfig;
    userApiClientConfig: UserApiClientConfig;
    secretsManagerClientConfig: SecretsManagerClientConfig;
    s3ClientConfig: S3ClientConfig;
};

export type UserApiClientConfig = UserApiClientConfig.Jwt | UserApiClientConfig.Mock;
export declare namespace UserApiClientConfig {
    export type Jwt = {
        implementation: "JWT";
    } & Omit<Param0<typeof createJwtUserApiClient>, "getIp" | "getOidcAccessToken">;

    export type Mock = {
        implementation: "MOCK";
        user: User;
    };
}

// All these assert<Equals<...>> are just here to help visualize what the type
// actually is. It's hard to tell just by looking at the definition
// with all these Omit, Pick Param0<typeof ...>.
// It could have been just a comment but comment lies. Instead here
// we are forced, if we update the types, to update the asserts statement
// or else we get red squiggly lines.
assert<
    Equals<
        UserApiClientConfig,
        | {
              implementation: "JWT";
              oidcClaims: {
                  email: string;
                  familyName: string;
                  firstName: string;
                  username: string;
                  groups: string;
                  local: string;
              };
          }
        | {
              implementation: "MOCK";
              user: {
                  email: string;
                  familyName: string; //Obama
                  firstName: string; //Barack
                  username: string; //obarack, the idep
                  groups: string[];
                  local: KcLanguageTag;
              };
          }
    >
>();

export declare type SecretsManagerClientConfig =
    | SecretsManagerClientConfig.LocalStorage
    | SecretsManagerClientConfig.Vault;
export declare namespace SecretsManagerClientConfig {
    export type Vault = {
        implementation: "VAULT";
    } & Param0<typeof createVaultSecretsManagerClient>;

    export type LocalStorage = {
        implementation: "LOCAL STORAGE";
        paramsForTranslator: { engine: string };
    } & Param0<typeof createLocalStorageSecretManagerClient>;
}

assert<
    Equals<
        SecretsManagerClientConfig,
        | {
              implementation: "VAULT";
              url: string;
              engine: string;
              role: string;
              keycloakParams: {
                  url: string;
                  realm: string;
                  clientId: string;
              };
          }
        | {
              implementation: "LOCAL STORAGE";
              paramsForTranslator: { engine: string };
              artificialDelayMs: number;
              doReset: boolean;
          }
    >
>();

export declare type S3ClientConfig = S3ClientConfig.LocalStorage | S3ClientConfig.Minio;
export declare namespace S3ClientConfig {
    export type Minio = {
        implementation: "MINIO";
    } & Param0<typeof createMinioS3Client>;

    export type LocalStorage = {
        implementation: "DUMMY";
    } & Unifiable<Param0<typeof createDummyS3Client>>;

    type Unifiable<T> = T extends void ? {} : T;
}

assert<
    Equals<
        S3ClientConfig,
        | {
              implementation: "MINIO";
              url: string;
              keycloakParams: {
                  url: string;
                  realm: string;
                  clientId: string;
              };
          }
        | {
              implementation: "DUMMY";
          }
    >
>();

export declare type OidcClientConfig = OidcClientConfig.Phony | OidcClientConfig.Keycloak;
export declare namespace OidcClientConfig {
    export type Phony = {
        implementation: "PHONY";
    } & Omit<Param0<typeof createPhonyOidcClient>, "user">;

    export type Keycloak = {
        implementation: "KEYCLOAK";
    } & Param0<typeof createKeycloakOidcClient>;
}

assert<
    Equals<
        OidcClientConfig,
        | {
              implementation: "PHONY";
              isUserLoggedIn: boolean;
          }
        | {
              implementation: "KEYCLOAK";
              url: string;
              realm: string;
              clientId: string;
          }
    >
>();

export type OnyxiaApiClientConfig =
    | OnyxiaApiClientConfig.Mock
    | OnyxiaApiClientConfig.Official;

export declare namespace OnyxiaApiClientConfig {
    export type Mock = {
        implementation: "MOCK";
    } & Param0<typeof createMockOnyxiaApiClient>;

    export type Official = {
        implementation: "OFFICIAL";
    } & Omit<
        Param0<typeof createOfficialOnyxiaApiClient>,
        | "getCurrentlySelectedDeployRegionId"
        | "getOidcAccessToken"
        | "getCurrentlySelectedProjectId"
    >;
}

assert<
    Equals<
        OnyxiaApiClientConfig,
        | {
              implementation: "MOCK";
              availableDeploymentRegions: {
                  id: string;
                  servicesMonitoringUrlPattern: string | undefined;
                  s3MonitoringUrlPattern: string | undefined;
                  namespacePrefix: string;
                  defaultIpProtection: boolean | undefined;
                  defaultNetworkPolicy: boolean | undefined;
                  kubernetesClusterDomain: string;
                  initScriptUrl: string;
              }[];
          }
        | {
              implementation: "OFFICIAL";
              url: string;
          }
    >
>();

export const usecases = [
    myFiles,
    myLab,
    app,
    user,
    catalogExplorerUseCase,
    deploymentRegionUseCase,
    explorersUseCase,
    launcherUseCase,
    projectConfigUseCase,
    projectSelectionUseCase,
    publicIpUseCase,
    restorablePackageConfigsUseCase,
    runningServiceUseCase,
    secretExplorerUseCase,
    userAuthenticationUseCase,
    userConfigsUseCase,
];

const { createMiddlewareEvtAction } = createMiddlewareEvtActionFactory(usecases);

export type ThunksExtraArgument = {
    createStoreParams: CreateStoreParams;
    secretsManagerClient: SecretsManagerClient;
    userApiClient: UserApiClient;
    oidcClient: OidcClient;
    onyxiaApiClient: OnyxiaApiClient;
    s3Client: S3Client;
    evtAction: ReturnType<typeof createMiddlewareEvtAction>["evtAction"];
};

createStore.isFirstInvocation = true;

export async function createStore(params: CreateStoreParams) {
    assert(
        createStore.isFirstInvocation,
        "createStore has already been called, " +
            "only one instance of the store is supposed to" +
            "be created",
    );

    createStore.isFirstInvocation = false;

    const { oidcClientConfig } = params;

    const oidcClient = await (() => {
        switch (oidcClientConfig.implementation) {
            case "PHONY":
                return createPhonyOidcClient({
                    "isUserLoggedIn": oidcClientConfig.isUserLoggedIn,
                    "user": (() => {
                        const { userApiClientConfig } = params;

                        assert(
                            userApiClientConfig.implementation === "MOCK",
                            [
                                "if oidcClientConfig.implementation is 'PHONY' then",
                                "userApiClientConfig.implementation should be 'MOCK'",
                            ].join(" "),
                        );

                        return userApiClientConfig.user;
                    })(),
                });
            case "KEYCLOAK":
                return createKeycloakOidcClient(oidcClientConfig);
        }
    })();

    dOidcClient.resolve(oidcClient);

    let getCurrentlySelectedDeployRegionId: (() => string) | undefined = undefined;
    let getCurrentlySelectedProjectId: (() => string) | undefined = undefined;

    const onyxiaApiClient = (() => {
        const { onyxiaApiClientConfig } = params;
        switch (onyxiaApiClientConfig.implementation) {
            case "MOCK":
                return createMockOnyxiaApiClient(onyxiaApiClientConfig);
            case "OFFICIAL":
                return createOfficialOnyxiaApiClient({
                    "url": onyxiaApiClientConfig.url,
                    "getCurrentlySelectedDeployRegionId": () =>
                        getCurrentlySelectedDeployRegionId?.(),
                    "getOidcAccessToken": !oidcClient.isUserLoggedIn
                        ? undefined
                        : oidcClient.getAccessToken,
                    "getCurrentlySelectedProjectId": () =>
                        getCurrentlySelectedProjectId?.(),
                });
        }
    })();

    const secretsManagerClient = oidcClient.isUserLoggedIn
        ? await (async () => {
              const { secretsManagerClientConfig } = params;
              switch (secretsManagerClientConfig.implementation) {
                  case "LOCAL STORAGE":
                      return createLocalStorageSecretManagerClient(
                          secretsManagerClientConfig,
                      );
                  case "VAULT":
                      return createVaultSecretsManagerClient(secretsManagerClientConfig);
              }
          })()
        : createObjectThatThrowsIfAccessed<SecretsManagerClient>();

    const userApiClient = oidcClient.isUserLoggedIn
        ? createJwtUserApiClient({
              "oidcClaims": (() => {
                  const { userApiClientConfig } = params;

                  switch (userApiClientConfig.implementation) {
                      case "JWT":
                          return userApiClientConfig.oidcClaims;
                      case "MOCK":
                          return phonyClientOidcClaims;
                  }
              })(),
              "getOidcAccessToken": oidcClient.getAccessToken,
          })
        : createObjectThatThrowsIfAccessed<UserApiClient>();

    const s3Client = oidcClient.isUserLoggedIn
        ? await (async () => {
              const { s3ClientConfig } = params;
              switch (s3ClientConfig.implementation) {
                  case "MINIO":
                      return createMinioS3Client(s3ClientConfig);
                  case "DUMMY":
                      return createDummyS3Client();
              }
          })()
        : createObjectThatThrowsIfAccessed<S3Client>();

    const { evtAction, middlewareEvtAction } = createMiddlewareEvtAction();

    const store = configureStore({
        "reducer": usecasesToReducer(usecases),
        "middleware": getDefaultMiddleware =>
            [
                ...getDefaultMiddleware({
                    "thunk": {
                        "extraArgument": id<ThunksExtraArgument>({
                            "createStoreParams": params,
                            oidcClient,
                            onyxiaApiClient,
                            secretsManagerClient,
                            userApiClient,
                            s3Client,
                            evtAction,
                        }),
                    },
                }),
                middlewareEvtAction,
            ] as const,
    });

    dStoreInstance.resolve(store);

    if (oidcClient.isUserLoggedIn) {
        store.dispatch(secretExplorerUseCase.privateThunks.initialize());
    }

    await store.dispatch(userAuthenticationUseCase.privateThunks.initialize());
    if (oidcClient.isUserLoggedIn) {
        await store.dispatch(userConfigsUseCase.privateThunks.initialize());
    }

    if (oidcClient.isUserLoggedIn) {
        store.dispatch(restorablePackageConfigsUseCase.privateThunks.initialize());
    }

    await store.dispatch(deploymentRegionUseCase.privateThunks.initialize());
    getCurrentlySelectedDeployRegionId = () =>
        store.getState().deploymentRegion.selectedDeploymentRegionId;

    if (oidcClient.isUserLoggedIn) {
        await store.dispatch(projectSelectionUseCase.privateThunks.initialize());
        getCurrentlySelectedProjectId = () =>
            store.getState().projectSelection.selectedProjectId;
    }

    store.dispatch(runningServiceUseCase.privateThunks.initialize());

    return store;
}

export type Store = ReturnType<typeof createStore>;

export type RootState = ReturnType<Store["getState"]>;

export type Dispatch = Store["dispatch"];

export type ThunkAction<ReturnType = Promise<void>> = GenericThunkAction<
    ReturnType,
    RootState,
    ThunksExtraArgument,
    Action<string>
>;

const dStoreInstance = new Deferred<Store>();

/**
 * A promise that resolve to the store instance.
 * If createStore isn't called it's pending forever.
 *
 * @deprecated: use "js/react/hooks" to interact with the store.
 */
export const { pr: prStore } = dStoreInstance;

const dOidcClient = new Deferred<OidcClient>();

/** @deprecated */
export const { pr: prOidcClient } = dOidcClient;
