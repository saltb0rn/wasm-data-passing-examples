let wasmExports = undefined;

function print(cstrAddr) {
  let len = 0;
  let ptr = cstrAddr;
  const mem = new Uint8Array(wasmExports.memory.buffer);
  while (mem[ptr] != 0) {
    len++;
    ptr++;
  }
  const bytes = new Uint8Array(wasmExports.memory.buffer, cstrAddr, len);
  console.log(new TextDecoder().decode(bytes));
}

function test_from_c_to_js_return_string() {
  console.group("=============================");
  console.log(`from_c_to_js_return_string()`);
  const result = wasmExports.from_c_to_js_return_string();
  console.log(result);
  console.groupEnd();
}

function test_from_c_to_js_return_struct(a, b) {
  console.group("=============================");
  console.log(`from_c_to_js_return_struct(${a}, ${b})`);
  const result = wasmExports.from_c_to_js_return_struct(a, b);
  console.log(result);
  console.groupEnd();
}

function test_sum_for_struct(a, b) {
  console.group("=============================");
  console.log(`sum_for_struct(${a}, ${b})`);
  const result = wasmExports.sum_for_struct(a, b);
  console.log(result);
  console.groupEnd();
}

function test_from_c_to_js_return_string() {
  console.group("=============================");
  console.log(`from_c_to_js_return_string()`);
  const result = wasmExports.from_c_to_js_return_string();
  print(result);
  console.groupEnd();
}

function test_from_c_to_js_return_union() {
  console.group("=============================");
  console.log(`from_c_to_js_return_union()`);
  const result = wasmExports.from_c_to_js_return_union();
  console.log(result);
  console.groupEnd();
}

function test_from_c_to_js_return_function_ptr() {
  console.group("=============================");
  console.log(`from_c_to_js_return_function_ptr()`);
  const ptr = wasmExports.from_c_to_js_return_function_ptr();
  console.log("function ptr: ", ptr);
  table.get(ptr)();
  console.groupEnd();
}

function test_from_js_to_c_string(text) {
  console.group("=============================");
  console.log(`from_js_to_c_string(${text})`);
  let jsStr = "Message from JavaScript";
  let cStr = jsStr + "\0";
  let bytesForcStr = (new TextEncoder()).encode(cStr);
  const strAddr = wasmExports.malloc(bytesForcStr.length);
  console.log(`strAddr = ${strAddr}`);
  const memBlock = new Uint8Array(wasmExports.memory.buffer, strAddr, bytesForcStr.length);
  memBlock.set(bytesForcStr);
  wasmExports.from_js_to_c_string(strAddr);
  wasmExports.free(strAddr);
  console.groupEnd();
}

function test_from_js_to_c_struct() {
  console.group("=============================");
  console.log("from_js_to_c_struct((example_struct){ .a=10, .b=200 })");
  let structAddr = wasmExports.malloc(8);
  console.log(`structAddr = ${structAddr}`);

  let dv = new DataView(wasmExports.memory.buffer, structAddr, 8);
  dv.setInt32(0, 10, true);
  dv.setInt32(4, 200, true);
  let result = wasmExports.from_js_to_c_struct(structAddr);
  console.log(result);
  wasmExports.free(structAddr);
  console.groupEnd();
}

function test_from_js_to_c_array(arr) {
  console.group("=============================");
  console.log(`from_js_to_c_array([${arr.join(',')}], ${arr.length})`);
  // arr 是整形数组, 每个元素的大小为 4 bytes
  let arrAddr = wasmExports.malloc(4 * arr.length);
  console.log(`arrAddr = ${arrAddr}`);
  let dv = new DataView(wasmExports.memory.buffer, arrAddr, 4 * arr.length);
  for (let i = 0; i < arr.length; i++) {
    dv.setInt32(i * 4, arr[i], true);
  }
  const result = wasmExports.from_js_to_c_array(arrAddr, arr.length);
  console.log(result);
  wasmExports.free(arrAddr);
  console.groupEnd();
}

function test_from_js_to_c_union(value, fid) {
  console.group("=============================");
  console.log(`from_js_to_c_union(${value}, ${fid})`);
  // 32-bit 下 example_union 的大小为 4 bytes, 64-bit 下为 8 bytes
  let unionAddr = wasmExports.malloc(4);
  console.log(`unionAddr = ${unionAddr}`);
  let dv = new DataView(wasmExports.memory.buffer, unionAddr, 4);
  if (0 == fid) {
    dv.setInt8(0, value.charCodeAt(0), true);
  } else {
    dv.setInt32(0, value, true);
  }
  const result = wasmExports.from_js_to_c_union(unionAddr, fid);
  console.log(result);
  wasmExports.free(unionAddr);
  console.groupEnd();
}

function test_from_js_to_c_function_ptr() {
  console.group("=============================");
  console.log(`from_js_to_c_function_ptr()`);
  const newref = table.grow(1);
  table.set(newref, wasmExports.callback_to_set);
  wasmExports.from_js_to_c_function_ptr(newref);
  console.groupEnd();
}

const table = new WebAssembly.Table({ element: "anyfunc", initial: 3, maximum: 10 });

WebAssembly.instantiateStreaming(
  fetch('c.wasm'),
  {
    env: {

      '__indirect_function_table': table,
      print,

      from_c_to_js_struct: (example_struct_addr) => {
        console.group("=============================");
        console.log(`from_c_to_js_struct(${example_struct_addr})`);
        /* { a: int, b: long int }
           在 wasm32 的情况下, size 为 8 bytes;
           在 wasm64 的情况下, size 为 16 bytes;
           到目前为止只支持 wasm32.
        */
        // Uint32 = 4 bytes * 8 bits = 32 bits
        const data = new Uint32Array(wasmExports.memory.buffer, example_struct_addr, 2);
        console.log(`example_struct = { a=${data[0]}, b=${data[1]} }`);
        console.groupEnd();
      },

      from_c_to_js_string: (str_addr) => {
        console.group("=============================");
        console.log(`from_c_to_js_string(${str_addr})`);
        // C 语言的字符串是以 '\0' 结尾的, 所以找到 str_addr 之后的第一个 '\0' 字符就可以算出字符串长度
        print(str_addr);
        console.groupEnd();
      },

      from_c_to_js_enum: (example_enum) => {
        console.group("=============================");
        console.log(`from_c_to_js_enum(${example_enum})`);
        console.groupEnd();
      },

      from_c_to_js_union: (example_union_addr, field_index) => {
        console.group("=============================");
        console.log(`from_c_to_js_union(${example_union_addr})`);
        /*
          example_union 为 { c: char, li: long int },

          联合中大小最大的字段 li, 类型是 long int,

          因此, example_union 在 wasm32 下大小为 4 个字节, 在 wasm64 下大小为 8 个字节;
         */
        const bytes = new Uint8Array(wasmExports.memory.buffer, example_union_addr, 4);
        if (0 == field_index) {
          console.log(`example_union.c = ${String.fromCharCode(bytes[0])}`);
        } else {
          console.log(`example_union.li = ${new Uint32Array(bytes)[0]}`);
        }
        console.groupEnd();
      },

      from_c_to_js_pointer: (est_ptr) => {
        console.group("=============================");
        console.log(`from_c_to_js_pointer(${est_ptr})`);
        const data = new Uint32Array(wasmExports.memory.buffer, est_ptr, 2);
        console.log(`example_struct = { a=${data[0]}, b=${data[1]} }`);
        console.groupEnd();
      },

      from_c_to_js_function_ptr: (callback_ptr) => {
        console.group("=============================");
        console.log(`from_c_to_js_function_ptr(${callback_ptr})`);
        // 这里编译得到的 WASM 模块的 WebAssembly.Table 的字段是 __indirect_function_table
        // callback_ptr 是函数指针, 也就是 WebAssembly.Table 上元素的索引
        table.get(callback_ptr)(/* 对于接受参数的函数可以传参数 */);
        console.groupEnd();
      },

      from_c_to_js_array: (arr_addr, len) => {
        console.group("=============================");
        console.log(`from_c_to_js_array(${arr_addr})`);
        /*
          arr 是 int 数组: (int []){ 1, 2, 3, 4 }, 长度为 4 个元素, 每个元素 4 bytes.
         */
        const int_arr = new Uint32Array(wasmExports.memory.buffer, arr_addr, len);
        console.log(int_arr);
        console.groupEnd();
      }
    }
  }
).then((w) => {
  wasmExports = w.instance.exports;
  // 处理从 C 过来的数据
  wasmExports.test();
  test_from_c_to_js_return_struct(2, 100);
  test_sum_for_struct(2, 100);
  test_from_c_to_js_return_string();
  test_from_c_to_js_return_union();
  test_from_c_to_js_return_function_ptr();

  // 传递数据到 C 中
  test_from_js_to_c_string("Message from JavaScript");
  test_from_js_to_c_struct();
  test_from_js_to_c_array([1, 2, 3, 4]);
  test_from_js_to_c_union(200, 1);
  test_from_js_to_c_union('c', 0);
  test_from_js_to_c_function_ptr();

});
