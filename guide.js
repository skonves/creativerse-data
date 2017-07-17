const Neo = require('neo4j-http-client')

const client = new Neo('http://localhost:7474', 'neo4j', 'good2go')

go();

async function go() {
	const data = await getData('sword_lumite');

	const pruned = data.map(pruneCraftable).map(c => {
		return {
			item: c.item.name,
			yield: c.recipe.result_count,
			unlocks_on: c.unlocks_on ? c.unlocks_on.name : undefined,
			discovered_by: c.discovered_by ? c.discovered_by.name : undefined,
			item: c.item.name,
			materials: c.materials.reduce((a, b) => {
				a[b.item.name] = b.required_count
				return a
			}, {})
		}
	})

	console.log(JSON.stringify(pruned, null, ' '));
	//console.log(JSON.stringify(data.map(pruneCraftable), null, '  '));
}

async function getData(name) {
	const result = await client.query([{
		statement:
		`MATCH (:Item {name: {name}})<-[*0..100]-(r:Recipe)
with Distinct r
MATCH p=(n:Item)<-[:RESULTS_IN]-(r)<-[u:USED_IN]-(mat)
OPTIONAL MATCH (mat)<-[:IS]-(i:Item)
OPTIONAL MATCH (r)<-[:DISCOVERS]-(disc:Item)
OPTIONAL MATCH (r)<-[:UNLOCKS]-(ul:Item)
with n, r, disc, ul, u, mat, collect(i) as options
with n, r, disc, ul, collect({required_count: u.count, material: mat, options: options}) as materials
return n as item, collect(distinct {recipe: r, discovered_by: disc, unlocks_on: ul, materials: materials}) as recipes`,
		parameters: { name }
	}]);

	return result[0];
}

function pruneCraftable(craftable) {
	const recipe = craftable.recipes.sort((a, b) => a.craft_id - b.craft_id)[0]

	return {
		item: craftable.item,
		recipe: recipe.recipe,
		unlocks_on: recipe.unlocks_on,
		discovered_by: recipe.discovered_by,
		materials: recipe.materials.map(pruneMaterial)
	}
}

function pruneMaterial(material) {
	return {
		required_count: material.required_count,
		item: material.options && material.options.length ? material.options[0] : material.material
	};
}

function getGenerations(data, name) {
	const result = [];

	result[0] = data.filter(d => d.item.name === name);

	return result
}
