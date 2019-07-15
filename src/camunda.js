import * as utils from './utils'

/**
 * This function restructures the product object into a check object for better manipulations in camunda qa check
 * @param {Object} p Product Object
 * @return {Object} restructured product object
 */
const restructure = p => {

  p.ingredient.applicators.forEach( app => {
    delete app.$$hashKey
    app.materials.forEach( mat => {
      delete mat.$$hashKey
      delete mat.gramsTotal
      delete mat.materialId
      delete mat.oz
      delete mat.seriseId
      mat.formulaWt = mat.gramsOnScale
      delete mat.gramsOnScale
      mat.actualAvg = null
      mat.actualDiff = null
      mat.actualWt = null
    })
  })

  const check = {
    productId: p.product_id,
    productDescription: p.product_desc,
    ingredient: {
      crust: {
        name: p.ingredient.crust.name,
        formulaWt: p.ingredient.crust.gramsOnScale,
        actualWt: null,
        actualAvg: null,
        actualDiff: null,
        tolerance: p.ingredient.crust.tolerance,
      },
      sauce: {
        name: p.ingredient.sauce.name,
        formulaWt: p.ingredient.sauce.gramsOnScale,
        actualWt: null,
        actualAvg: null,
        actualDiff: null,
        tolerance: p.ingredient.sauce.tolerance,
      },
      applicators: p.ingredient.applicators
    },
    isManual: false,
    conditionOfBelts: 'Good',
    beltDescription: null
  }

  return check
}

const post = (url, param, json) => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', url + param)
    xhr.onreadystatechange = handleResponse
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onerror = e => reject(e)
    xhr.send(json)

    function handleResponse () {
      if (xhr.readyState === 4) {
        if (xhr.status < 300 && xhr.status >= 200) {
          resolve(xhr.responseText)
        } else {
          reject(xhr.responseText)
        }
      }
    }
  })
}

export const startQACheck = (product, line) => {
  const FORM_KEY = 'QAFormProductOnly'
  const PATH = `process-definition/key/${FORM_KEY}/start`
  
  const p = restructure(product)

  const toSend = {
    variables : {
      _currentLine : { value : line, type : "String" },
      _product: { value : JSON.stringify(p), type: "String"}
    }, 
    businessKey : null
  }

  post(utils.camundaRestApi, PATH, JSON.stringify(toSend)).then(res => {
    utils.alert('success', 'Successful', 'A Camunda QA Check Process has been started')
  }).catch(e => {
    utils.alert('error', 'Connection Error', `Camunda QA Check Process failed to start due to ${e} but you can still start it manually`)
  })
}