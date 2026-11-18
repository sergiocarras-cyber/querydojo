declare module 'virtual:problem-index' {
  const index: import('./lib/problems/types').ProblemMeta[];
  export default index;
}

declare module 'virtual:problems/*' {
  const problems: import('./lib/problems/types').Problem[];
  export default problems;
}
