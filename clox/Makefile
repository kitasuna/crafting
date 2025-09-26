CC=gcc
CFLAGS=-Wall -std=c99
TARGET=cloxmain
# SOURCES=main.c utils.c
SOURCES=main.c chunk.c compiler.c debug.c memory.c object.c scanner.c table.c value.c vm.c

$(TARGET): $(SOURCES)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCES)

clean:
	rm -f $(TARGET)

.PHONY: clean
