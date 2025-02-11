import { assert } from "tsafe/assert";
import type { ThunkAction } from "../setup";
import type { DeploymentRegion } from "../ports/OnyxiaApiClient";
import { createSlice } from "@reduxjs/toolkit";
import { thunks as userConfigsThunks } from "./userConfigs";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
    createObjectThatThrowsIfAccessedFactory,
    isPropertyAccessedByReduxOrStorybook,
} from "../tools/createObjectThatThrowsIfAccessed";
import type { RootState } from "../setup";

type DeploymentRegionState = {
    availableDeploymentRegions: DeploymentRegion[];
    selectedDeploymentRegionId: string;
};

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory({
    "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook,
});

export const { name, reducer, actions } = createSlice({
    "name": "deploymentRegion",
    "initialState": createObjectThatThrowsIfAccessed<DeploymentRegionState>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<DeploymentRegionState>) => payload,
        "deploymentRegionChanged": (
            state,
            { payload }: PayloadAction<{ deploymentRegionId: string }>,
        ) => {
            const { deploymentRegionId } = payload;

            state.selectedDeploymentRegionId = deploymentRegionId;
        },
    },
});

export const thunks = {
    "changeDeploymentRegion":
        (params: { deploymentRegionId: string }): ThunkAction =>
        async (...args) => {
            const [dispatch, , { oidcClient }] = args;

            const { deploymentRegionId } = params;

            if (oidcClient.isUserLoggedIn) {
                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "deploymentRegionId",
                        "value": deploymentRegionId,
                    }),
                );
            } else {
                localStorage.setItem(localStorageKey, deploymentRegionId);
            }

            dispatch(actions.deploymentRegionChanged({ deploymentRegionId }));
        },
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient, oidcClient }] = args;

            const availableDeploymentRegions =
                await onyxiaApiClient.getAvailableRegions();

            const getAvailablePreviouslySelectedRegionIdFromLocalStorage = () => {
                const value = localStorage.getItem(localStorageKey);

                if (
                    value !== null &&
                    !availableDeploymentRegions.map(({ id }) => id).includes(value)
                ) {
                    localStorage.removeItem(localStorageKey);

                    return null;
                }

                return value;
            };

            if (!oidcClient.isUserLoggedIn) {
                dispatch(
                    actions.initialize({
                        availableDeploymentRegions,
                        "selectedDeploymentRegionId":
                            getAvailablePreviouslySelectedRegionIdFromLocalStorage() ??
                            availableDeploymentRegions[0].id,
                    }),
                );

                return;
            }

            {
                const selectedDeploymentRegionId =
                    getAvailablePreviouslySelectedRegionIdFromLocalStorage();

                localStorage.removeItem(localStorageKey);

                if (selectedDeploymentRegionId !== null) {
                    await dispatch(
                        userConfigsThunks.changeValue({
                            "key": "deploymentRegionId",
                            "value": selectedDeploymentRegionId,
                        }),
                    );

                    dispatch(
                        actions.initialize({
                            availableDeploymentRegions,
                            selectedDeploymentRegionId,
                        }),
                    );

                    return;
                }
            }

            {
                const selectedDeploymentRegionId =
                    getState().userConfigs.deploymentRegionId.value;

                if (
                    selectedDeploymentRegionId !== null &&
                    availableDeploymentRegions
                        .map(({ id }) => id)
                        .includes(selectedDeploymentRegionId)
                ) {
                    dispatch(
                        actions.initialize({
                            availableDeploymentRegions,
                            selectedDeploymentRegionId,
                        }),
                    );

                    return;
                }
            }

            {
                const deploymentRegionId = availableDeploymentRegions[0].id;

                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "deploymentRegionId",
                        "value": deploymentRegionId,
                    }),
                );

                dispatch(
                    actions.initialize({
                        availableDeploymentRegions,
                        "selectedDeploymentRegionId": deploymentRegionId,
                    }),
                );
            }
        },
};

export const selectors = (() => {
    const selectedDeploymentRegion = (rootState: RootState): DeploymentRegion => {
        const { selectedDeploymentRegionId, availableDeploymentRegions } =
            rootState.deploymentRegion;

        const selectedDeploymentRegion = availableDeploymentRegions.find(
            ({ id }) => id === selectedDeploymentRegionId,
        );

        assert(selectedDeploymentRegion !== undefined);

        return selectedDeploymentRegion;
    };

    return { selectedDeploymentRegion };
})();

const localStorageKey = "selectedDeploymentRegionId";
