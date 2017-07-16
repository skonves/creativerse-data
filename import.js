const Neo = require('neo4j-http-client')

const client = new Neo('http://localhost:7474', 'neo4j', 'good2go')

go()

async function go() {
	const items = require('./json/protoitems.json');
	const craft = require('./json/protocraft.json');

	await client.query(items.map(getItemStatement))
	await client.query(items.map(getMaterialStatements).reduce((a, b) => a.concat(b)))
	await client.query(items.map(getItemMaterialStatements).reduce((a, b) => a.concat(b)))
	await client.query(craft.recipes.filter(recipe => recipe.unlock_on_item).map(getDiscoversItemStatement))
	await client.query(craft.recipes.filter(recipe => recipe.unlock_materials).map(getUnlocksItemStatement).reduce((a, b) => a.concat(b)))
	await client.query(craft.recipes.map(getRecipeStatement))
	await client.query(items.filter(item => item.craft_id).map(getTeachesStatement))
	await client.query(craft.recipes.map(getResultsInStatement))
	await client.query(craft.recipes.map(getUsedInStatements).reduce((a, b) => a.concat(b)))
	await client.query(craft.recipes.map(getMaterialUsedInStatements).reduce((a, b) => a.concat(b)))
}

function getItemStatement(item) {
	const paramsList = Object.keys(item).filter(key => {
		return typeof (item[key]) != 'object' && key != 'name'
	}).map(key => {
		return `${key}: ${JSON.stringify(item[key])}`
	})

	return {
		statement: `MERGE (n:Item {name: "${item.name}"}) SET n += {${paramsList.join(', ')}}`,
		parameters: {}
	}
}

function getMaterialStatements(item) {
	return (item.material_ids || []).map(id => {
		return {
			statement: `MERGE (n:Material {id: "${id}"})`,
			parameters: {}
		}
	})
}

function getItemMaterialStatements(item) {
	return (item.material_ids || []).map(id => {
		return {
			statement: `MATCH (a:Item {name: "${item.name}"}),(b:Material {id: "${id}"}) MERGE (a)-[:IS]->(b)`,
			parameters: {}
		}
	})
}

function getDiscoversItemStatement(recipe) {
	return {
		statement: `MATCH (a:Item {name: "${recipe.unlock_on_item}"}),(b:Item {name: "${recipe.result}"}) MERGE (a)-[:DISCOVERS]->(b)`,
		parameters: {}
	}
}

function getUnlocksItemStatement(recipe) {
	return Object.keys(recipe.unlock_materials).map(material => {
		return {
			statement: `MATCH (a:Item {name: "${material}"}),(b:Item {name: "${recipe.result}"}) MERGE (a)-[:UNLOCKS]->(b)`,
			parameters: {}
		}
	})
}

function getRecipeStatement(recipe) {
	const paramsList = Object.keys(recipe).filter(key => {
		return typeof (recipe[key]) != 'object' && key != 'result' && key != 'craft_id'
	}).map(key => {
		return `${key}: ${JSON.stringify(recipe[key])}`
	})

	return {
		statement: `MERGE (n:Recipe {craft_id: "${recipe.craft_id}"}) SET n += {${paramsList.join(', ')}}`,
		parameters: {}
	}
}

function getTeachesStatement(item) {
	return {
		statement: `MATCH (a:Item {craft_id: ${item.craft_id}}) MATCH (b:Recipe {craft_id: "${item.craft_id}"}) MERGE (a)-[:TEACHES]->(b)`,
		parameters: {}
	}
}

function getResultsInStatement(recipe) {
	return {
		statement: `MATCH (a:Recipe {craft_id: "${recipe.craft_id}"}), (b:Item {name: "${recipe.result}"}) MERGE (a)-[:RESULTS_IN]->(b)`,
		parameters: {}
	}
}

function getUsedInStatements(recipe) {
	return Object.keys(recipe.materials).map(material => {
		return {
			statement: `MATCH (a:Item {name: "${material}"}),(b:Recipe {craft_id: "${recipe.craft_id}"}) MERGE (a)-[r:USED_IN]->(b) SET r += {count: ${recipe.materials[material]}}`,
			parameters: {}
		}
	})
}

function getMaterialUsedInStatements(recipe) {
	return Object.keys(recipe.materials).map(material => {
		return {
			statement: `MATCH (a:Material {id: "${material}"}),(b:Recipe {craft_id: "${recipe.craft_id}"}) MERGE (a)-[r:USED_IN]->(b) SET r += {count: ${recipe.materials[material]}}`,
			parameters: {}
		}
	})
}

// MATCH p=(:Item {name: "stairs_stone"})<-[:RESULTS_IN|:USED_IN|:IS*0..100]-() RETURN p


/*

Crafting Guide Query

MATCH (:Item {name: "chair_stone"})<-[*0..20]-(r:Recipe)
with Distinct r
MATCH p=(n:Item)<-[:RESULTS_IN]-(r)<-[u:USED_IN]-(mat)
OPTIONAL MATCH (mat)<-[:IS]-(i:Item)
with n, r, u, mat, collect({option: i}) as options
with n, r, collect({required: u, material: mat, options: options}) as materials
return n as result, collect({recipe: r, materials: materials}) as recipes

*/