declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.css' {
  const classes: { [key: string]: string }
  export default classes
}

// If your project uses imported images or SVGs in TSX, consider adding:
// declare module '*.svg'
// declare module '*.png'
// declare module '*.jpg'
