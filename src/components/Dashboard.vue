<template>
  <div class="flex flex-col items-center justify-center">
    <img class="imagem" src="/easy-redes.png" alt="Easy Pallet Logo">
  </div>

  <div>
    <footer class="footer">
      <p>© 2024 by Maria Laura Roriz. Mini Easy Pallet.</p>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.imagem {
  max-width: 100%;
  max-height: 80vh;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.footer {
  text-align: center;
  margin: 1rem 0;
}
</style>