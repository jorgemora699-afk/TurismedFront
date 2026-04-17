1. Instalar Expo CLI (global)
install -g expo-cli

2.  instalar dependencias
install axios
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

3. Configurar la URL del backend
En el archivo de configuración (por ejemplo constants/api.js), actualiza la IP:
jsexport const API_URL = 'http://TU_IP_LOCAL:5000';
// Ejemplo: 'http://192.168.1.100:5000'

⚠️ No uses localhost desde el dispositivo/emulador; usa la IP local de tu computador.

4. Correr la app
npx expo start