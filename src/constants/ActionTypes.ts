// App
export const INITIALIZED = 'INITIALIZED'
export const INITIALIZE_SETTINGS = 'INITIALIZE_SETTINGS'
export const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR'
export const SET_MQL  = 'SET_MQL'
export const SET_BACKGROUND_IMAGE = 'SET_BACKGROUND_IMAGE'

// Songs
export const FILL_VISIBLE_SONGS = 'FILL_VISIBLE_SONGS'
export const FILL_VISIBLE_SONGS_FULLFILLED = 'FILL_VISIBLE_SONGS_FULLFILLED'
export const FILL_VISIBLE_SONG = 'FILL_VISIBLE_SONG'
export const FILL_VISIBLE_SONG_FULLFILLED = 'FILL_VISIBLE_SONG_FULLFILLED'

// Player
export const VOLUME_SET = 'VOLUME_SET'
export const START_PLAYING = 'START_PLAYING'
export const STOP_PLAYING = 'STOP_PLAYING'
export const PAUSE_PLAYING = 'PAUSE_PLAYING'
export const SET_CURRENT_PLAYING = 'SET_CURRENT_PLAYING'
export const SET_CURRENT_TIME = 'SET_CURRENT_TIME'
export const PLAY_ALL = 'PLAY_ALL'
export const REGISTER_PLAYER_ERROR = 'REGISTER_PLAYER_ERROR'
export const HIDE_PLAYER = 'HIDE_PLAYER'
export const SONG_PLAYED = 'SONG_PLAYED'

// Collection
export const GET_COLLECTION = 'GET_COLLECTION'
export const COLLECTION_FETCHED = 'COLLECTION_FETCHED'
export const ADD_TO_COLLECTION = 'ADD_TO_COLLECTION'
export const REMOVE_FROM_COLLECTION = 'REMOVE_FROM_COLLECTION'
export const REMOVE_FROM_COLLECTION_REJECTED = 'REMOVE_FROM_COLLECTION_REJECTED'
export const REMOVE_FROM_COLLECTION_FULFILLED = 'REMOVE_FROM_COLLECTION_FULFILLED'
export const RECEIVE_COLLECTION = 'RECEIVE_COLLECTION'
export const RECEIVE_COLLECTION_ITEM = 'RECEIVE_COLLECTION_ITEM'
export const DELETE_COLLECTION = 'DELETE_COLLECTION'
export const EXPORT_COLLECTION = 'EXPORT_COLLECTION'
export const EXPORT_COLLECTION_FINISHED = 'EXPORT_COLLECTION_FINISHED'
export const EXPORT_COLLECTION_REJECTED = 'EXPORT_COLLECTION_REJECTED'
export const IMPORT_COLLECTION = 'IMPORT_COLLECTION'
export const IMPORT_COLLECTION_FINISHED = 'IMPORT_COLLECTION_FINISHED'
export const IMPORT_COLLECTION_REJECTED = 'IMPORT_COLLECTION_REJECTED'
export const RECEIVE_COLLECTION_REJECTED = 'RECEIVE_COLLECTION_REJECTED'
export const RECEIVE_COLLECTION_FINISHED = 'RECEIVE_COLLECTION_FINISHED'
export const PROCESS_ARTISTS = 'PROCESS_ARTISTS'

// Playlist
export const ADD_TO_PLAYLIST = 'ADD_TO_PLAYLIST'
export const ADD_ALBUM_TO_PLAYLIST = 'ADD_ALBUM_TO_PLAYLIST'
export const ADD_SONGS_TO_PLAYLIST = 'ADD_SONGS_TO_PLAYLIST'
export const ADD_SONG_IDS_TO_PLAYLIST = 'ADD_SONG_IDS_TO_PLAYLIST'
export const SET_COLUMN_SORT = 'SET_COLUMN_SORT'
export const SAVE_PLAYLIST = 'SAVE_PLAYLIST'
export const GET_PLAYLISTS_REJECTED = 'GET_PLAYLISTS_REJECTED'
export const RECEIVE_PLAYLISTS = 'RECEIVE_PLAYLISTS'

// Queue
export const ADD_TO_QUEUE = 'ADD_TO_QUEUE'
export const ADD_SONGS_TO_QUEUE_BY_ID = 'ADD_SONGS_TO_QUEUE_BY_ID'
export const RECEIVE_QUEUE = 'RECEIVE_QUEUE'
export const GET_QUEUE_REJECTED = 'GET_QUEUE_REJECTED'
export const ADD_SONGS_TO_QUEUE = 'ADD_SONGS_TO_QUEUE'
export const PLAY_NEXT = 'PLAY_NEXT'
export const PLAY_PREV = 'PLAY_PREV'
export const CLEAR_QUEUE = 'CLEAR_QUEUE'
export const SHUFFLE = 'SHUFFLE'
export const REPEAT = 'REPEAT'

// Search
export const TOGGLE_SEARCH = 'TOGGLE_SEARCH'
export const SET_SEARCH_TERM = 'SET_SEARCH_TERM'
export const START_SEARCH = 'START_SEARCH'
export const SEARCH_REJECTED = 'SEARCH_REJECTED'
export const PUSH_TO_VIEW = 'PUSH_TO_VIEW'
export const SEARCH_FINISHED = 'SEARCH_FINISHED'
export const RECEIVE_SEARCH_INDEX = 'RECEIVE_SEARCH_INDEX'
export const SAVE_SEARCH_INDEX = 'SAVE_SEARCH_INDEX'
export const RECEIVE_SEARCH_INDEX_REJECTED = 'RECEIVE_SEARCH_INDEX_REJECTED'

// Settings
export const SAVE_SETTINGS = 'SAVE_SETTINGS'
export const SETTINGS_SAVED_SUCCESSFULLY = 'SETTINGS_SAVED_SUCCESSFULLY'
export const SETTINGS_SAVED_REJECTED = 'SETTINGS_SAVED_REJECTED'
export const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS'
export const RECEIVE_SETTINGS_FINISHED = 'RECEIVE_SETTINGS_FINISHED'
export const GET_SETTINGS_REJECTED = 'GET_SETTINGS_REJECTED'
export const REMOVE_FROM_SETTINGS_REJECTED = 'REMOVE_FROM_SETTINGS_REJECTED'
export const DELETE_SETTINGS = 'DELETE_SETTINGS'
export const ADD_PROVIDER = 'ADD_PROVIDER'
export const REMOVE_PROVIDER = 'REMOVE_PROVIDER'
export const START_SCAN_SOURCES = 'START_SCAN_SOURCES'

// Notifications
export const SEND_NOTIFICATION = 'SEND_NOTIFICATION'

// Connection
export const SET_ONLINE_CONNECTION = 'SET_ONLINE_CONNECTION'
export const SET_OFFLINE_CONNECTION = 'SET_OFFLINE_CONNECTION'

// Artist
export const LOAD_ARTIST = 'LOAD_ARTIST'
export const RECEIVE_ARTIST_METADATA = 'RECEIVE_ARTIST_METADATA'
export const NO_ARTIST_NAME = 'NO_ARTIST_NAME'

// Sync
export const SETUP_DATABASE_SYNC_FINISHED = 'SETUP_DATABASE_SYNC_FINISHED'
export const SETTING_UP_DATABASE_SYNC_STARTED = 'SETTING_UP_DATABASE_SYNC_STARTED'

// IPFS
export const LOAD_IPFS_FILE = 'LOAD_IPFS_FILE'
export const IPFS_FILE_FOUND = 'IPFS_FILE_FOUND'
export const START_IPFS_FOLDER_SCAN = 'START_IPFS_FOLDER_SCAN'
export const IPFS_NON_SUPPORTED_ITEM = 'IPFS_NON_SUPPORTED_ITEM'
export const IPFS_FOLDER_SCANNED = 'IPFS_FOLDER_SCANNED'
export const IPFS_FOLDER_SCAN_FAILED = 'IPFS_FOLDER_SCAN_FAILED'
export const IPFS_FOLDER_FOUND = 'IPFS_FOLDER_FOUND'
export const IPFS_SONG_SAVED = 'IPFS_SONG_SAVED'

export const SAVE_COLLECTION_FULLFILLED = 'SAVE_COLLECTION_FULLFILLED'
export const SAVE_COLLECTION_FAILED = 'SAVE_COLLECTION_FAILED'
