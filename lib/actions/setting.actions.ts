'use server';

import { ISettingInput } from '@/types';
import { cookies } from 'next/headers';
import data from '../data';
import { connectToDatabase } from '../db';
import Setting from '../db/models/setting.model';
import { formatError } from '../utils';
import { cache } from 'react';
import { revalidatePath } from 'next/cache';

/**
 * Fetches the application settings.
 * Wrapped in React.cache to de-duplicate requests within a single render.
 * It handles the initial creation of settings from seed data if none exist.
 */
export const getSetting = cache(async (): Promise<ISettingInput> => {
  await connectToDatabase();
  let setting = await Setting.findOne().lean();

  if (!setting) {
    console.log('No settings found, creating from seed data...');
    // If no setting in DB, create it from the seed data.
    // The result of `create` is a Mongoose document, so we convert it.
    await Setting.create(data.settings[0]);
    setting = await Setting.findOne().lean();
  }

  // Ensure the final object is plain and serializable.
  return JSON.parse(JSON.stringify(setting));
});

/**
 * Updates the application settings and revalidates the cache.
 */
export const updateSetting = async (newSetting: ISettingInput) => {
  try {
    await connectToDatabase();
    await Setting.findOneAndUpdate({}, newSetting, {
      upsert: true,
      new: true,
    });

    // Revalidate all pages that use this data to show the new settings.
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Setting updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
};

/**
 * Server action to update the currency cookie.
 */
export const setCurrencyOnServer = async (newCurrency: string) => {
  // FIX: The cookies() function itself is not a promise.
  (await
    // FIX: The cookies() function itself is not a promise.
    cookies()).set('currency', newCurrency, { path: '/' });

  return {
    success: true,
    message: 'Currency updated successfully',
  };
};
