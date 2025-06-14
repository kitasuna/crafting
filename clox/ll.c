#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node{
	char* data;

	struct Node* prev;

	struct Node* next;
} Node;

struct Node* createNode(char* data) {
	struct Node *new_node = (struct Node *) malloc(sizeof(struct Node));
	new_node->data = strdup(data);
	new_node->next = NULL;
	new_node->prev = NULL;
	return new_node;
}

void insertAtBeginning(struct Node** head_ref, char* data) {
	struct Node* newNode = createNode(data);
	newNode->next = *head_ref;
	if (*head_ref != NULL) {
		(*head_ref)->prev = newNode;
	}
	*head_ref = newNode;
}

struct Node* findNode(struct Node* head, char* tgt) {
	if (head == NULL) {
		return NULL;
	}
	struct Node* current = head;

	while (current != NULL) {
		if (strcmp(current->data, tgt) == 0) {
			return current;
		}
		current = current->next;
	}

	return NULL;
}

int deleteNode(struct Node** head_ref, struct Node* head, struct Node* tgt) {
	if (head == NULL) {
		return 1;
	}

	if (tgt == NULL) {
		return 1;
	}

	struct Node* current = head;

	while (current != NULL) {
		if (current == tgt) {
			if (current->prev != NULL) {
				current->prev->next = current->next;
			} else {
				// this was the head node, update head ref
				*head_ref = current->next;
			}
			if (current->next != NULL) {
				current->next->prev = current->prev;
			}
			free(current->data);
			free(current);
			return 0;
		}
		current = current->next;
	}

	// node not found
	return 1;
}

void printList(struct Node* head) {
	struct Node* current = head;

	while (current != NULL) {
		printf("%s\n", current->data);
		current = current->next;
	}
	printf("\n");
}

int main() {
	struct Node* head = NULL;
	insertAtBeginning(&head, "crafting");
	insertAtBeginning(&head, "interpreters");
	insertAtBeginning(&head, "chromebook");
	printList(head);

	struct Node* found = findNode(head, "chromebook");
	if (found != NULL) {
		printf("Found it! %s\n", found->data);
	} else {
		printf("Could not find node...\n");	
	}

	// delete interpreters node
  int deleteResult = deleteNode(&head, head, found);
	if (deleteResult != 0) {
		printf("Couldn't delete node: ", found->data);
		return 1;
	} else {
		printf("Deleted node!\n");
		printList(head);
	}
	return 0;
}
