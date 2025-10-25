
import fs from 'fs/promises';
import { initialChats, initialProducts, initialSettings, initialReports } from './data';
import { WhatsAppChat, Product, Settings, Report } from './types';

// This setup assumes the Render environment allows writing to the file system.
// We will create a 'db' directory to store our JSON data files.
const DB_DIR = './db';
const CHATS_PATH = `${DB_DIR}/chats.json`;
const PRODUCTS_PATH = `${DB_DIR}/products.json`;
const SETTINGS_PATH = `${DB_DIR}/settings.json`;
const REPORTS_PATH = `${DB_DIR}/reports.json`;

// In-memory cache of the data, populated from files on startup.
let chats: WhatsAppChat[] = [];
let products: Product[] = [];
let settings: Settings | null = null;
let reports: Report[] = [];

// Helper to load data from a file, creating it with a default value if it doesn't exist.
async function loadDataFromFile<T>(path: string, defaultValue: T): Promise<T> {
    try {
        await fs.access(path);
        const fileContent = await fs.readFile(path, 'utf-8');
        // Handle empty file case
        if (fileContent) {
            return JSON.parse(fileContent);
        }
        return defaultValue;
    } catch {
        await fs.writeFile(path, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
}

// Initialize the database on server start
export async function initializeDatabase() {
    try {
        await fs.mkdir(DB_DIR, { recursive: true });
        products = await loadDataFromFile(PRODUCTS_PATH, initialProducts);
        settings = await loadDataFromFile(SETTINGS_PATH, initialSettings);
        chats = await loadDataFromFile(CHATS_PATH, initialChats);
        reports = await loadDataFromFile(REPORTS_PATH, initialReports);
        console.log('Database initialized successfully from files.');
    } catch (error) {
        console.error('Failed to initialize database from file system:', error);
        // Fallback to in-memory defaults if file system access fails
        products = initialProducts;
        settings = initialSettings;
        chats = initialChats;
        reports = initialReports;
        console.log('Using in-memory default data as fallback.');
    }
}

// Getters for accessing the in-memory data
export const getChats = (): WhatsAppChat[] => chats;
export const getProducts = (): Product[] => products;
export const getSettings = (): Settings => settings!;
export const getReports = (): Report[] => reports;

// Functions to save the current state of in-memory data back to the files
export const saveChats = () => fs.writeFile(CHATS_PATH, JSON.stringify(chats, null, 2));
export const saveProducts = () => fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
export const saveSettings = () => fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
export const saveReports = () => fs.writeFile(REPORTS_PATH, JSON.stringify(reports, null, 2));
