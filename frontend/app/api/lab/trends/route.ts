import dataset from '../../../../server/google-trends.json';
// Read-only publication of development-curated source files. No live Google dependency.
export function GET(){return Response.json(dataset,{headers:{'Cache-Control':'public, max-age=300'}});}
