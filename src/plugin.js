import merge from 'lodash.merge';

const getPath = (obj, key, i = 0) => {
  key = key.split ? key.split('.') : key;

  for (; i < key.length; i++) {
    obj = obj[key[i]] || (obj[key[i]] = !i && {});
  }

  return obj;
};

const setPath = (obj, key, val, k, res) => {
  key = key.split('.');
  k = key.pop();

  return (res = getPath(obj, key)) && k ? (res[k] = val) : undefined;
};

const defaultReducer = (state, paths) =>
  (paths.length === 0
    ? state
    : paths.reduce(
        (substate, path) =>
          setPath(substate, path, getPath(state, path)) && substate,
        {}
      ));

const canWriteStorage = storage => {
  try {
    storage.setItem('@@', 1);
    storage.removeItem('@@');
    return true;
  } catch (e) {
    return false;
  }
};

export default function createPersistedState(
  {
    key = 'vuex',
    paths = [],
    getState = (key, storage) => {
      const value = storage.getItem(key);

      try {
        return value && value !== 'undefined' ? JSON.parse(value) : undefined;
      } catch (err) {
        return undefined;
      }
    },
    setState = (key, state, storage) =>
      storage.setItem(key, JSON.stringify(state)),
    reducer = defaultReducer,
    storage = window && window.localStorage,
    filter = () => true,
    subscriber = store => handler => store.subscribe(handler)
  } = {}
) {
  if (!canWriteStorage(storage)) {
    throw new Error('Invalid storage instance given');
  }

  return store => {
    const savedState = getState(key, storage);

    if (typeof savedState === 'object') {
      store.replaceState(merge({}, store.state, savedState));
    }

    subscriber(store)((mutation, state) => {
      if (filter(mutation)) {
        setState(key, reducer(state, paths), storage);
      }
    });
  };
}
