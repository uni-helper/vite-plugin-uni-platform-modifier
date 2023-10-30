<script lang="ts" setup>
const handleDefaultClick = () => {
  console.log('default')
}
const handleH5Click = () => {
  console.log('h5')
}
</script>

<template>
  <div class="dark" class.mp-weixin="wx">
    <button v-text.h5="'hello'" v-text.h5.mp-weixin="'h5'" @click.h5="handleH5Click" class.h5="h5-class"
      class="default-class" @click="handleDefaultClick" />
  </div>
</template>
