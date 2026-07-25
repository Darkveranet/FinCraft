export function makeLoanProductsAPI(self) {
  return {
      list:     ()       => self._g('/loanproducts'),
      basicDetails: () => self._g('/loanproducts/basic-details'),
      get:      (id)     => self._g(`/loanproducts/${id}`),
      template: (params) => self._g('/loanproducts/template', params),
      create:   (b)      => self._p('/loanproducts', b),
      update:   (id, b)  => self._u(`/loanproducts/${id}`, b)
    };
}

export function makeSavingsProductsAPI(self) {
  return {
      list:     ()       => self._g('/savingsproducts'),
      get:      (id)     => self._g(`/savingsproducts/${id}`),
      template: (params) => self._g('/savingsproducts/template', params),
      create:   (b)      => self._p('/savingsproducts', b),
      update:   (id, b)  => self._u(`/savingsproducts/${id}`, b),
      delete:   (id)     => self._d(`/savingsproducts/${id}`)
    };
}

export function makeShareProductsAPI(self) {
  return {
    list:     ()       => self._g('/products/share'),
    get:      (id)     => self._g(`/products/share/${id}`),
    template: (params) => self._g('/products/share/template', params),
    create:   (b)      => self._p('/products/share', b),
    update:   (id, b)  => self._u(`/products/share/${id}`, b),
    command:  (productId, cmd, body, type = 'share') =>
      self._p(`/products/${encodeURIComponent(type)}/${productId}?command=${encodeURIComponent(cmd)}`, body || {})
  };
}

export function makeFdProductsAPI(self) {
  return {
    list:     ()       => self._g('/fixeddepositproducts'),
    get:      (id)     => self._g(`/fixeddepositproducts/${id}`),
    template: (params) => self._g('/fixeddepositproducts/template', params),
    create:   (b)      => self._p('/fixeddepositproducts', b),
    update:   (id, b)  => self._u(`/fixeddepositproducts/${id}`, b),
    delete:   (id)     => self._d(`/fixeddepositproducts/${id}`)
  };
}

export function makeRdProductsAPI(self) {
  return {
    list:     ()       => self._g('/recurringdepositproducts'),
    get:      (id)     => self._g(`/recurringdepositproducts/${id}`),
    template: (params) => self._g('/recurringdepositproducts/template', params),
    create:   (b)      => self._p('/recurringdepositproducts', b),
    update:   (id, b)  => self._u(`/recurringdepositproducts/${id}`, b),
    delete:   (id)     => self._d(`/recurringdepositproducts/${id}`)
  };
}

export function makeProductMixAPI(self) {
  return {
      list:     ()       => self._g('/loanproducts'),
      get:      (id)     => self._g(`/loanproducts/${id}/productmix`),
      template: (id)     => self._g(`/loanproducts/${id}/productmix`),
      create:   (id, b)  => self._p(`/loanproducts/${id}/productmix`, b),
      update:   (id, b)  => self._u(`/loanproducts/${id}/productmix`, b),
      delete:   (id)     => self._d(`/loanproducts/${id}/productmix`)
    };
}

export function makeFloatingRatesAPI(self) {
  return {
      list:   ()        => self._g('/floatingrates'),
      get:    (id)      => self._g(`/floatingrates/${id}`),
      create: (b)       => self._p('/floatingrates', b),
      update: (id, b)   => self._u(`/floatingrates/${id}`, b)
    };
}

export function makeRatesAPI(self) {
  return {
      list:   ()        => self._g('/rates'),
      get:    (id)      => self._g(`/rates/${id}`),
      create: (b)       => self._p('/rates', b),
      update: (id, b)   => self._u(`/rates/${id}`, b)
    };
}
