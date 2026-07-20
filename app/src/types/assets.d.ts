// Lets TypeScript accept `require('./file.ext')` for bundled binary assets;
// Metro (the bundler) already knows how to resolve these at build time.
declare module '*.wav' {
  const value: number;
  export default value;
}
declare module '*.mp3' {
  const value: number;
  export default value;
}
declare module '*.png' {
  const value: number;
  export default value;
}
declare module '*.jpg' {
  const value: number;
  export default value;
}
declare module '*.jpeg' {
  const value: number;
  export default value;
}
