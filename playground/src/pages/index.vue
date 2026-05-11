<script lang="ts" setup>
function handleDefaultClick() {
  console.log('default')
}
function handleH5Click() {
  console.log('h5')
}
</script>

<template>
  <div class="dark" class.mp-weixin="wx">
    <button
      class.h5="h5-class" class="default-class" @click.h5="handleH5Click" @click="handleDefaultClick"
      v-text.h5="'hello'" v-text.h5.mp-weixin="'h5'"
    />
  </div>
</template>
