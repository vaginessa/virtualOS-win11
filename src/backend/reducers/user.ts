import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { User } from '@supabase/supabase-js';
import { localStorageKey } from '../utils/constant';
import { UserSession } from './fetch/analytics';
import { supabase } from './fetch/createClient';
import { BuilderHelper, CacheRequest } from './helper';


type Data = User & {
    plans: string[];
    greenlist?: boolean;
    usageTime?: UsageTime

};
interface UsageTime {
    email: string
    end_time: string
    package: string
    start_time: string
    total_time: number
}
const initialState: Data = {
    id: 'unknown',
    aud: 'unknown',
    created_at: 'unknown',
    app_metadata: {},
    user_metadata: {},
    plans: [],
    greenlist: false,

};

export const userAsync = {
    fetch_user: createAsyncThunk('fetch_user', async (): Promise<Data> => {
        return await CacheRequest('user', 30, async () => {
            const {
                data: {
                    session: { user }
                },
                error
            } = await supabase.auth.getSession();
            if (error != null) throw error;
            let payloadUser = { ...user };

            console.log(user, 'fetchuser');
            const { data: plans, error: err } = await supabase.rpc(
                'get_user_plans',
                {
                    user_account_id: user?.id
                }
            );
            if (err != null) throw err;
            {
                const { data, error } = await supabase.rpc("validate_user_access", {
                    user_account_id: user?.id,
                    plan_name: ['day', 'week', 'month', 'fullstack', 'admin']
                });
                if (error) throw error;
                payloadUser = { ...payloadUser, greenlist: data }
            }
            if (payloadUser?.greenlist == true) {
                const { data, error } = await supabase.rpc("get_usage_time_user", {
                    user_id: payloadUser.id,
                });
                if (error) return;

                payloadUser = { ...payloadUser, usageTime: data?.at(0) };
            }
            await UserSession(user.email);

            return {
                ...payloadUser,
                plans: plans.map((x) => x.plans)
            };
        });
    })
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        user_delete: (state) => {
            state.id = 'unknown'
            supabase.auth.signOut();
            localStorage.removeItem(localStorageKey.user);
        }
    },
    extraReducers: (builder) => {
        BuilderHelper(builder, {
            fetch: userAsync.fetch_user,
            hander: (state, action) => {
                state.id = action.payload.id;
                state.email = action.payload.email;
                state.plans = action.payload.plans
                state.greenlist = action.payload.greenlist
                state.usageTime = action.payload.usageTime
            }
        });
    }
});
